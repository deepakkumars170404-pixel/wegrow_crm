package com.wegrow.telecaller

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telecom.TelecomManager
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class WegrowTelephonyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), WegrowInCallService.Companion.CallStateListener {

    companion object {
        private const val TAG = "WegrowTelephony"
    }

    init {
        WegrowInCallService.listener = this
    }

    override fun getName(): String = "WegrowTelephony"

    override fun onCallStateUpdate(
        state: String,
        rawState: Int,
        phoneNumber: String,
        contactName: String,
        isIncoming: Boolean,
        durationSeconds: Int,
        activeTimeMs: Long,
        isSpeaker: Boolean,
        isMuted: Boolean,
        hasHeldCall: Boolean,
        heldPhoneNumber: String,
        heldContactName: String,
        isConference: Boolean
    ) {
        try {
            val params = Arguments.createMap().apply {
                putString("state", state)
                putInt("rawState", rawState)
                putString("phoneNumber", phoneNumber)
                putString("contactName", contactName)
                putBoolean("isIncoming", isIncoming)
                putInt("durationSeconds", durationSeconds)
                putDouble("activeTimeMs", activeTimeMs.toDouble())
                putBoolean("isAttended", activeTimeMs > 0L)
                putBoolean("isSpeaker", isSpeaker)
                putBoolean("isMuted", isMuted)
                putBoolean("hasHeldCall", hasHeldCall)
                putString("heldPhoneNumber", heldPhoneNumber)
                putString("heldContactName", heldContactName)
                putBoolean("isConference", isConference)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onCallStateChanged", params)
        } catch (e: Exception) {}
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun getCurrentCallState(promise: Promise) {
        try {
            val state = WegrowInCallService.currentState
            val activeTime = WegrowInCallService.callActiveTimeMs
            val durSecs = if (activeTime > 0) {
                if (state == "DISCONNECTED") {
                    Math.max(0, ((WegrowInCallService.callEndTimeMs - activeTime) / 1000).toInt())
                } else {
                    Math.max(0, ((System.currentTimeMillis() - activeTime) / 1000).toInt())
                }
            } else 0

            val map = Arguments.createMap().apply {
                putString("state", state)
                putString("phoneNumber", WegrowInCallService.currentPhoneNumber)
                putString("contactName", WegrowInCallService.contactName)
                putBoolean("isIncoming", WegrowInCallService.isIncomingCall)
                putInt("durationSeconds", durSecs)
                putDouble("activeTimeMs", activeTime.toDouble())
                putBoolean("isAttended", activeTime > 0L)
                putBoolean("isSpeaker", WegrowInCallService.isSpeakerOn)
                putBoolean("isMuted", WegrowInCallService.isMuted)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CALL_STATE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun directCall(phoneNumber: String, promise: Promise) {
        try {
            val cleanDigits = phoneNumber.replace(Regex("[^0-9+]"), "")
            if (cleanDigits.contains("9952337331")) {
                promise.reject("BLOCKED", "Calling 9952337331 is permanently blocked")
                return
            }

            WegrowInCallService.currentPhoneNumber = cleanDigits
            WegrowInCallService.isIncomingCall = false
            WegrowInCallService.contactName = WegrowInCallService.resolveContactName(reactContext, cleanDigits)
            WegrowInCallService.callDialStartTimeMs = System.currentTimeMillis()
            WegrowInCallService.callActiveTimeMs = 0L
            WegrowInCallService.callEndTimeMs = 0L
            WegrowInCallService.notifyUpdate("DIALING", 1)

            // PRIORITY 1: Use TelecomManager.placeCall (the native way for InCallService to place calls without UI collisions)
            val telecomManager = reactContext.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            val callUri = Uri.fromParts("tel", cleanDigits, null)
            val extras = Bundle().apply {
                putBoolean(TelecomManager.EXTRA_START_CALL_WITH_SPEAKERPHONE, false)
            }

            var placed = false
            if (telecomManager != null &&
                androidx.core.content.ContextCompat.checkSelfPermission(reactContext, android.Manifest.permission.CALL_PHONE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                try {
                    telecomManager.placeCall(callUri, extras)
                    placed = true
                } catch (e: Exception) {
                    Log.w(TAG, "telecomManager.placeCall fallback to ACTION_CALL: ${e.message}")
                }
            }

            if (!placed) {
                val intent = Intent(Intent.ACTION_CALL).apply {
                    data = callUri
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
            }

            // Re-assert Wegrow Telecaller to foreground so dialer UI is immediately visible
            val bringBackIntent = Intent(reactContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("call_action", "ACTIVE_CALL")
                putExtra("phone_number", cleanDigits)
                putExtra("contact_name", WegrowInCallService.contactName)
            }
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    reactContext.startActivity(bringBackIntent)
                } catch (e: Exception) {}
            }, 500)

            promise.resolve(true)
        } catch (e: Exception) {
            // Fallback to ACTION_DIAL if ACTION_CALL encounters any issue
            try {
                val cleanDigits = phoneNumber.replace(Regex("[^0-9+]"), "")
                val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                    data = Uri.parse("tel:$cleanDigits")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(dialIntent)
                promise.resolve(true)
            } catch (err: Exception) {
                promise.reject("CALL_FAILED", err.message)
            }
        }
    }

    @ReactMethod
    fun answerCall(promise: Promise) {
        try {
            val success = WegrowInCallService.answerCurrentCall()
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("ANSWER_FAILED", e.message)
        }
    }

    @ReactMethod
    fun endCall(promise: Promise) {
        try {
            val disconnected = WegrowInCallService.disconnectCurrentCall()
            if (disconnected) {
                promise.resolve(true)
                return
            }
            val telecomManager = reactContext.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val ended = telecomManager?.endCall() ?: false
                promise.resolve(ended)
                return
            }
            Runtime.getRuntime().exec("input keyevent 6") // KEYCODE_ENDCALL
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                Runtime.getRuntime().exec("input keyevent 6")
                promise.resolve(true)
            } catch (err: Exception) {
                promise.reject("END_CALL_FAILED", e.message)
            }
        }
    }

    @ReactMethod
    fun setSpeaker(enabled: Boolean, promise: Promise) {
        try {
            val res = WegrowInCallService.setSpeakerRoute(enabled)
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("SPEAKER_FAILED", e.message)
        }
    }

    @ReactMethod
    fun setMute(enabled: Boolean, promise: Promise) {
        try {
            val res = WegrowInCallService.setMuteState(enabled)
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("MUTE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun sendDtmf(digit: String, promise: Promise) {
        try {
            if (digit.isNotEmpty()) {
                val res = WegrowInCallService.playDtmfTone(digit[0])
                promise.resolve(res)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("DTMF_FAILED", e.message)
        }
    }

    @ReactMethod
    fun holdCall(promise: Promise) {
        try {
            val res = WegrowInCallService.holdCurrentCall()
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("HOLD_FAILED", e.message)
        }
    }

    @ReactMethod
    fun unholdCall(promise: Promise) {
        try {
            val res = WegrowInCallService.unholdCurrentCall()
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("UNHOLD_FAILED", e.message)
        }
    }

    @ReactMethod
    fun mergeCalls(promise: Promise) {
        try {
            val res = WegrowInCallService.mergeConference()
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("MERGE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun swapCalls(promise: Promise) {
        try {
            val res = WegrowInCallService.swapCalls()
            promise.resolve(res)
        } catch (e: Exception) {
            promise.reject("SWAP_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getContactName(phoneNumber: String, promise: Promise) {
        try {
            val name = WegrowInCallService.resolveContactName(reactContext, phoneNumber)
            promise.resolve(name)
        } catch (e: Exception) {
            promise.resolve("")
        }
    }

    @ReactMethod
    fun isDefaultDialer(promise: Promise) {
        try {
            val telecomManager = reactContext.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            val defaultDialer = telecomManager?.defaultDialerPackage
            val isDefault = defaultDialer == reactContext.packageName
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestDefaultDialer(promise: Promise) {
        try {
            val currentActivity = reactContext.currentActivity
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = reactContext.getSystemService(RoleManager::class.java)
                if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_DIALER)) {
                    val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
                    if (currentActivity != null) {
                        currentActivity.startActivityForResult(intent, 1001)
                        promise.resolve("PROMPT_SHOWN")
                        return
                    } else {
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        reactContext.startActivity(intent)
                        promise.resolve("PROMPT_SHOWN")
                        return
                    }
                }
            }

            // Fallback 1: Open Default Apps Settings directly
            val intent = Intent(android.provider.Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve("SETTINGS_OPENED")
        } catch (e: Exception) {
            try {
                // Fallback 2: Open App Info Settings
                val appInfoIntent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:" + reactContext.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(appInfoIntent)
                promise.resolve("APP_SETTINGS_OPENED")
            } catch (err: Exception) {
                promise.reject("ROLE_REQUEST_FAILED", err.message)
            }
        }
    }
}
