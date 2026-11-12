package com.wegrow.telecaller

import android.telecom.Call
import android.telecom.InCallService
import android.util.Log

class WegrowInCallService : InCallService() {

    companion object {
        private const val TAG = "WegrowInCallService"
        var currentCall: Call? = null
        var currentState: String = "IDLE"
        var currentPhoneNumber: String = ""
        var callDialStartTimeMs: Long = 0L
        var callActiveTimeMs: Long = 0L
        var callEndTimeMs: Long = 0L

        interface CallStateListener {
            fun onCallStateUpdate(
                state: String,
                rawState: Int,
                phoneNumber: String,
                durationSeconds: Int,
                activeTimeMs: Long
            )
        }

        var listener: CallStateListener? = null

        fun disconnectCurrentCall(): Boolean {
            currentCall?.let {
                try {
                    it.disconnect()
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to disconnect call", e)
                }
            }
            return false
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
                durationSeconds = durSecs,
                activeTimeMs = callActiveTimeMs
            )
        }
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        currentCall = call
        callDialStartTimeMs = System.currentTimeMillis()
        callActiveTimeMs = 0L
        callEndTimeMs = 0L

        try {
            val handleUri = call.details?.handle
            if (handleUri != null) {
                currentPhoneNumber = handleUri.schemeSpecificPart ?: ""
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not extract call handle", e)
        }

        val initialState = mapCallState(call.state)
        notifyUpdate(initialState, call.state)

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
