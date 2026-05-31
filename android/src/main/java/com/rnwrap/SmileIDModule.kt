package com.rnwrap

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.smileidentity.SmileID
import com.smileidentity.models.Config
import java.net.URL

@ReactModule(name = SmileIDModule.NAME)
class SmileIDModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  @ReactMethod
  fun initialize(
    useSandbox: Boolean,
    enableCrashReporting: Boolean,
    config: ReadableMap?,
    apiKey: String?,
    promise: Promise,
  ) {
    UiThreadUtil.runOnUiThread {
      try {
        if (config != null &&
          config.hasKey("partner_id") &&
          !config.getString("partner_id").isNullOrEmpty()
        ) {
          val smileConfig = Config(
            partnerId = config.getString("partner_id") ?: "",
            authToken = config.getString("auth_token") ?: "",
            prodLambdaUrl = config.getString("prod_lambda_url") ?: "",
            testLambdaUrl = config.getString("test_lambda_url") ?: "",
          )
          SmileID.initialize(
            reactApplicationContext,
            config = smileConfig,
            useSandbox = useSandbox,
            enableCrashReporting = enableCrashReporting,
          )
        } else {
          // Fall back to smile_config.json in assets
          SmileID.initialize(
            reactApplicationContext,
            useSandbox = useSandbox,
            enableCrashReporting = enableCrashReporting,
          )
        }
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("SmileID_INIT_ERROR", e.message, e)
      }
    }
  }

  @ReactMethod
  fun setCallbackUrl(url: String?, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        if (!url.isNullOrEmpty()) {
          SmileID.setCallbackUrl(URL(url))
        }
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("SmileID_CALLBACK_ERROR", e.message, e)
      }
    }
  }

  companion object {
    const val NAME = "SmileID"
  }
}
