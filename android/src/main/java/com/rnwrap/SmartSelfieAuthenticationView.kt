package com.rnwrap

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.smileidentity.SmileID
import com.smileidentity.results.SmileIDResult
import com.smileidentity.util.randomJobId

class SmartSelfieAuthenticationView(context: Context) :
  SmileIDComposeHostView(context = context, shouldUseAndroidLayout = true) {

  var userId by mutableStateOf("")
  var jobId by mutableStateOf<String?>(null)
  var allowAgentMode by mutableStateOf<Boolean?>(null)
  var allowNewEnroll by mutableStateOf<Boolean?>(null)
  var showAttribution by mutableStateOf<Boolean?>(null)
  var showInstructions by mutableStateOf<Boolean?>(null)
  var extraPartnerParams by mutableStateOf<Map<String, String>>(emptyMap())

  @Composable
  override fun Content() {
    SmileID.SmartSelfieAuthentication(
      userId = userId,
      jobId = jobId ?: randomJobId(),
      allowAgentMode = allowAgentMode ?: false,
      allowNewEnroll = allowNewEnroll ?: false,
      showAttribution = showAttribution ?: true,
      showInstructions = showInstructions ?: true,
      extraPartnerParams = extraPartnerParams,
      onResult = { result ->
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
