package com.rnwrap

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.smileidentity.SmileID

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
        SmileID.initialize(reactApplicationContext, useSandbox = useSandbox)
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
          SmileID.setCallbackUrl(url)
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
