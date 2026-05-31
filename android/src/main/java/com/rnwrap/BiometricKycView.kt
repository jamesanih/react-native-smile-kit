package com.rnwrap

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.smileidentity.SmileID
import com.smileidentity.compose.BiometricKYC
import com.smileidentity.models.IdInfo
import com.smileidentity.results.BiometricKycResult
import com.smileidentity.results.SmileIDResult
import com.smileidentity.util.randomJobId
import com.smileidentity.util.randomUserId
import kotlinx.collections.immutable.toImmutableMap

class BiometricKycView(context: Context) :
  SmileIDComposeHostView(context = context, shouldUseAndroidLayout = true) {

  var countryCode by mutableStateOf("")
  var idType by mutableStateOf("")
  var idNumber by mutableStateOf("")
  var firstName by mutableStateOf("")
  var lastName by mutableStateOf("")
  var userId by mutableStateOf<String?>(null)
  var jobId by mutableStateOf<String?>(null)
  var allowAgentMode by mutableStateOf<Boolean?>(null)
  var allowNewEnroll by mutableStateOf<Boolean?>(null)
  var showInstructions by mutableStateOf<Boolean?>(null)
  var showAttribution by mutableStateOf<Boolean?>(null)
  var useStrictMode by mutableStateOf<Boolean?>(null)
  var extraPartnerParams by mutableStateOf<Map<String, String>>(emptyMap())

  @Composable
  override fun Content() {
    SmileID.BiometricKYC(
      idInfo = IdInfo(
        country = countryCode,
        idType = idType,
        idNumber = idNumber,
        firstName = firstName,
        lastName = lastName,
        entered = true,
      ),
      userId = userId ?: randomUserId(),
      jobId = jobId ?: randomJobId(),
      allowAgentMode = allowAgentMode ?: false,
      allowNewEnroll = allowNewEnroll ?: false,
      showInstructions = showInstructions ?: true,
      showAttribution = showAttribution ?: true,
      extraPartnerParams = extraPartnerParams.toImmutableMap(),
      useStrictMode = useStrictMode ?: false,
      consentInformation = null,
      onResult = { result: SmileIDResult<BiometricKycResult> ->
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
