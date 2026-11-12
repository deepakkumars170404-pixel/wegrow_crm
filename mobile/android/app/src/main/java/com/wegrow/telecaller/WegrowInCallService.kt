package com.wegrow.telecaller

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.ContactsContract
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.util.Log
import androidx.core.app.NotificationCompat

class WegrowInCallService : InCallService() {

    companion object {
        private const val TAG = "WegrowInCallService"
        private const val CHANNEL_ID = "wegrow_incoming_calls"
        private const val NOTIFICATION_ID = 9001

        var instance: WegrowInCallService? = null
        var currentCall: Call? = null
        var currentState: String = "IDLE"
        var currentPhoneNumber: String = ""
        var contactName: String = ""
        var isIncomingCall: Boolean = false
        var isSpeakerOn: Boolean = false
        var isMuted: Boolean = false
        var callDialStartTimeMs: Long = 0L
        var callActiveTimeMs: Long = 0L
        var callEndTimeMs: Long = 0L

        interface CallStateListener {
            fun onCallStateUpdate(
                state: String,
                rawState: Int,
                phoneNumber: String,
                contactName: String,
                isIncoming: Boolean,
                durationSeconds: Int,
                activeTimeMs: Long,
                isSpeaker: Boolean,
                isMuted: Boolean
            )
        }

        var listener: CallStateListener? = null

        fun answerCurrentCall(): Boolean {
            currentCall?.let {
                try {
                    it.answer(VideoProfile.STATE_AUDIO_ONLY)
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to answer call", e)
                }
            }
            return false
        }

        fun disconnectCurrentCall(): Boolean {
            currentCall?.let {
                try {
                    if (it.state == Call.STATE_RINGING) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            it.reject(Call.REJECT_REASON_DECLINED)
                        } else {
                            @Suppress("DEPRECATION")
                            it.reject(false, null)
                        }
                    } else {
                        it.disconnect()
                    }
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to disconnect call", e)
                }
            }
            return false
        }

        fun setSpeakerRoute(enabled: Boolean): Boolean {
            instance?.let { service ->
                try {
                    val route = if (enabled) CallAudioState.ROUTE_SPEAKER else CallAudioState.ROUTE_EARPIECE
                    service.setAudioRoute(route)
                    isSpeakerOn = enabled
                    notifyUpdate(currentState, currentCall?.state ?: 0)
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to set audio route", e)
                }
            }
            return false
        }

        fun setMuteState(enabled: Boolean): Boolean {
            instance?.let { service ->
                try {
                    service.setMuted(enabled)
                    isMuted = enabled
                    notifyUpdate(currentState, currentCall?.state ?: 0)
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to set mute", e)
                }
            }
            return false
        }

        fun playDtmfTone(c: Char): Boolean {
            currentCall?.let {
                try {
                    it.playDtmfTone(c)
                    it.stopDtmfTone()
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to play DTMF", e)
                }
            }
            return false
        }

        fun resolveContactName(context: Context, phoneNumber: String): String {
            if (phoneNumber.isBlank()) return ""
            var name = ""
            try {
                val uri = Uri.withAppendedPath(
                    ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                    Uri.encode(phoneNumber)
                )
                val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)
                context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val idx = cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                        if (idx != -1) {
                            name = cursor.getString(idx) ?: ""
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not resolve contact name: ${e.message}")
            }
            return name
        }

        fun notifyUpdate(state: String, rawState: Int) {
            currentState = state
            val durSecs = if (callActiveTimeMs > 0) {
                if (state == "DISCONNECTED") {
                    Math.max(0, ((callEndTimeMs - callActiveTimeMs) / 1000).toInt())
                } else {
                    Math.max(0, ((System.currentTimeMillis() - callActiveTimeMs) / 1000).toInt())
                }
            } else 0

            listener?.onCallStateUpdate(
                state = state,
                rawState = rawState,
                phoneNumber = currentPhoneNumber,
                contactName = contactName,
                isIncoming = isIncomingCall,
                durationSeconds = durSecs,
                activeTimeMs = callActiveTimeMs,
                isSpeaker = isSpeakerOn,
                isMuted = isMuted
            )
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) instance = null
        cancelNotification()
    }

    override fun onCallAudioStateChanged(audioState: CallAudioState?) {
        super.onCallAudioStateChanged(audioState)
        audioState?.let {
            isSpeakerOn = (it.route == CallAudioState.ROUTE_SPEAKER)
            isMuted = it.isMuted
            notifyUpdate(currentState, currentCall?.state ?: 0)
        }
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        currentCall = call
        callDialStartTimeMs = System.currentTimeMillis()
        callActiveTimeMs = 0L
        callEndTimeMs = 0L
        isSpeakerOn = false
        isMuted = false

        try {
            val handleUri = call.details?.handle
            if (handleUri != null) {
                currentPhoneNumber = handleUri.schemeSpecificPart ?: ""
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not extract call handle", e)
        }

        isIncomingCall = (call.state == Call.STATE_RINGING)
        contactName = resolveContactName(this, currentPhoneNumber)

        val initialState = mapCallState(call.state)
        notifyUpdate(initialState, call.state)

        // Wake screen and bring In-Call activity forward
        wakeUpScreenAndLaunchUI()
        if (isIncomingCall) {
            showIncomingCallNotification()
        }

        call.registerCallback(object : Call.Callback() {
            override fun onStateChanged(c: Call, state: Int) {
                super.onStateChanged(c, state)
                handleStateChange(c, state)
            }
        })
    }

    private fun handleStateChange(c: Call, state: Int) {
        when (state) {
            Call.STATE_ACTIVE -> {
                // Remote party answered! Talk timer starts now!
                if (callActiveTimeMs == 0L) {
                    callActiveTimeMs = System.currentTimeMillis()
                }
                cancelNotification()
                notifyUpdate("ACTIVE", state)
            }
            Call.STATE_DIALING -> {
                notifyUpdate("DIALING", state)
            }
            Call.STATE_RINGING, Call.STATE_CONNECTING -> {
                notifyUpdate("RINGING", state)
            }
            Call.STATE_DISCONNECTED, Call.STATE_DISCONNECTING -> {
                callEndTimeMs = System.currentTimeMillis()
                cancelNotification()
                notifyUpdate("DISCONNECTED", state)
                if (currentCall == c) {
                    currentCall = null
                }
            }
            else -> {
                notifyUpdate(mapCallState(state), state)
            }
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        if (currentCall == call) {
            if (currentState != "DISCONNECTED") {
                callEndTimeMs = System.currentTimeMillis()
                notifyUpdate("DISCONNECTED", Call.STATE_DISCONNECTED)
            }
            currentCall = null
        }
        cancelNotification()
    }

    private fun wakeUpScreenAndLaunchUI() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            val wakeLock = pm?.newWakeLock(
                @Suppress("DEPRECATION")
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "wegrow:incoming_call_wake"
            )
            wakeLock?.acquire(15000)
        } catch (e: Exception) {
            Log.w(TAG, "WakeLock error", e)
        }

        try {
            val launchIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("call_action", if (isIncomingCall) "INCOMING_CALL" else "ACTIVE_CALL")
                putExtra("phone_number", currentPhoneNumber)
                putExtra("contact_name", contactName)
            }
            startActivity(launchIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch MainActivity on call", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Wegrow Telecaller incoming call alert"
                setSound(null, null)
                enableVibration(true)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    private fun showIncomingCallNotification() {
        try {
            val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("call_action", "INCOMING_CALL")
                putExtra("phone_number", currentPhoneNumber)
                putExtra("contact_name", contactName)
            }
            val fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                100,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val title = if (contactName.isNotBlank()) contactName else "Student Inquiry"
            val subtitle = "📞 Incoming Call: $currentPhoneNumber"

            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setOngoing(true)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .build()

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show incoming notification", e)
        }
    }

    private fun cancelNotification() {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.cancel(NOTIFICATION_ID)
        } catch (e: Exception) {}
    }

    private fun mapCallState(state: Int): String {
        return when (state) {
            Call.STATE_DIALING -> "DIALING"
            Call.STATE_RINGING -> "RINGING"
            Call.STATE_CONNECTING -> "CONNECTING"
            Call.STATE_ACTIVE -> "ACTIVE"
            Call.STATE_HOLDING -> "HOLDING"
            Call.STATE_DISCONNECTING -> "DISCONNECTING"
            Call.STATE_DISCONNECTED -> "DISCONNECTED"
            else -> "UNKNOWN"
        }
    }
}
