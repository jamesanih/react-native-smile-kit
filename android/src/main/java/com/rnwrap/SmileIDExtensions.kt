package com.rnwrap

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.smileidentity.results.BiometricKycResult
import com.smileidentity.results.DocumentVerificationResult
import com.smileidentity.results.SmartSelfieResult
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.json.JSONArray

fun SmartSelfieResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("result", Json.encodeToString(this@toWritableMap))
  }

fun DocumentVerificationResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("selfie", selfieFile?.absolutePath ?: "")
    putString("documentFrontFile", documentFrontFile?.absolutePath ?: "")
    putString("documentBackFile", documentBackFile?.absolutePath ?: "")
    putBoolean("didSubmitDocumentVerificationJob", didSubmitDocumentVerificationJob)
  }

fun BiometricKycResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("selfieImage", selfieFile?.absolutePath ?: "")
    val arr = JSONArray()
    livenessFiles.forEach { arr.put(it.absolutePath) }
    putString("livenessImages", arr.toString())
    putBoolean("didSubmitBiometricJob", didSubmitBiometricJob)
  }

fun Throwable.toErrorPayload(): WritableMap =
  Arguments.createMap().apply {
    putString("message", message ?: "Unknown error")
    putString("code", "")
  }
