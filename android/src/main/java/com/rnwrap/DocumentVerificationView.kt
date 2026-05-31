package com.rnwrap

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.smileidentity.SmileID
import com.smileidentity.compose.DocumentVerification
import com.smileidentity.models.AutoCapture
import com.smileidentity.results.DocumentVerificationResult
import com.smileidentity.results.SmileIDResult
import com.smileidentity.util.randomJobId
import com.smileidentity.util.randomUserId
import kotlin.time.Duration.Companion.seconds
import kotlinx.collections.immutable.toImmutableMap

class DocumentVerificationView(context: Context) :
  SmileIDComposeHostView(context = context, shouldUseAndroidLayout = true) {

  var countryCode by mutableStateOf("")
  var userId by mutableStateOf<String?>(null)
  var jobId by mutableStateOf<String?>(null)
  var documentType by mutableStateOf<String?>(null)
  var captureBothSides by mutableStateOf<Boolean?>(null)
  var autoCaptureTimeout by mutableStateOf<Int?>(null)
  var autoCapture by mutableStateOf<String?>(null)
  var idAspectRatio by mutableStateOf<Float?>(null)
  var allowAgentMode by mutableStateOf<Boolean?>(null)
  var allowGalleryUpload by mutableStateOf<Boolean?>(null)
  var allowNewEnroll by mutableStateOf<Boolean?>(null)
  var showInstructions by mutableStateOf<Boolean?>(null)
  var showAttribution by mutableStateOf<Boolean?>(null)
  var useStrictMode by mutableStateOf<Boolean?>(null)
  var skipApiSubmission by mutableStateOf<Boolean?>(null)
  var bypassSelfieCaptureWithFile by mutableStateOf<String?>(null)
  var extraPartnerParams by mutableStateOf<Map<String, String>>(emptyMap())

  @Composable
  override fun Content() {
    SmileID.DocumentVerification(
      userId = userId ?: randomUserId(),
      jobId = jobId ?: randomJobId(),
      countryCode = countryCode,
      documentType = documentType,
      captureBothSides = captureBothSides ?: true,
      autoCaptureTimeout = (autoCaptureTimeout ?: 10).seconds,
      autoCapture = when (autoCapture) {
        "ManualCaptureOnly" -> AutoCapture.ManualCaptureOnly
        else -> AutoCapture.AutoCapture
      },
      idAspectRatio = idAspectRatio,
      allowAgentMode = allowAgentMode ?: false,
      allowGalleryUpload = allowGalleryUpload ?: false,
      allowNewEnroll = allowNewEnroll ?: false,
      showInstructions = showInstructions ?: true,
      showAttribution = showAttribution ?: true,
      useStrictMode = useStrictMode ?: false,
      extraPartnerParams = extraPartnerParams.toImmutableMap(),
      onResult = { result: SmileIDResult<DocumentVerificationResult> ->
        when (result) {
          is SmileIDResult.Success ->
            dispatchDirectEvent("onSuccess", result.data.toWritableMap())
          is SmileIDResult.Error ->
            dispatchDirectEvent("onError", result.throwable.toErrorPayload())
        }
      },
    )
  }
}
