package com.rnwrap

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class RnWrapViewPackage : BaseReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(
      RnWrapViewManager(),
      BiometricKycViewManager(),
      DocumentVerificationViewManager(),
      SmartSelfieAuthenticationViewManager(),
      SmartSelfieEnrollmentViewManager(),
    )

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      SmileIDModule.NAME -> SmileIDModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      SmileIDModule.NAME to ReactModuleInfo(
        SmileIDModule.NAME,
        SmileIDModule::class.java.name,
        false,
        false,
        false,
        false,
      ),
    )
  }
}
