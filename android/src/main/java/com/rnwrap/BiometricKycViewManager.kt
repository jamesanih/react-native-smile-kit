package com.rnwrap

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.BiometricKycViewManagerDelegate
import com.facebook.react.viewmanagers.BiometricKycViewManagerInterface

@ReactModule(name = BiometricKycViewManager.NAME)
class BiometricKycViewManager :
  SimpleViewManager<BiometricKycView>(),
  BiometricKycViewManagerInterface<BiometricKycView> {

  private val delegate = BiometricKycViewManagerDelegate(this)

  override fun getDelegate() = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = BiometricKycView(context)

  @ReactProp(name = "countryCode")
  override fun setCountryCode(view: BiometricKycView?, value: String?) {
    view?.countryCode = value ?: ""
  }

  @ReactProp(name = "idType")
  override fun setIdType(view: BiometricKycView?, value: String?) {
    view?.idType = value ?: ""
  }

  @ReactProp(name = "idNumber")
  override fun setIdNumber(view: BiometricKycView?, value: String?) {
    view?.idNumber = value ?: ""
  }

  @ReactProp(name = "firstName")
  override fun setFirstName(view: BiometricKycView?, value: String?) {
    view?.firstName = value ?: ""
  }

  @ReactProp(name = "lastName")
  override fun setLastName(view: BiometricKycView?, value: String?) {
    view?.lastName = value ?: ""
  }

  @ReactProp(name = "userId")
  override fun setUserId(view: BiometricKycView?, value: String?) {
    view?.userId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "jobId")
  override fun setJobId(view: BiometricKycView?, value: String?) {
    view?.jobId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "allowAgentMode")
  override fun setAllowAgentMode(view: BiometricKycView?, value: Boolean) {
    view?.allowAgentMode = value
  }

  @ReactProp(name = "allowNewEnroll")
  override fun setAllowNewEnroll(view: BiometricKycView?, value: Boolean) {
    view?.allowNewEnroll = value
  }

  @ReactProp(name = "showInstructions")
  override fun setShowInstructions(view: BiometricKycView?, value: Boolean) {
    view?.showInstructions = value
  }

  @ReactProp(name = "showAttribution")
  override fun setShowAttribution(view: BiometricKycView?, value: Boolean) {
    view?.showAttribution = value
  }

  @ReactProp(name = "useStrictMode")
  override fun setUseStrictMode(view: BiometricKycView?, value: Boolean) {
    view?.useStrictMode = value
  }

  @ReactProp(name = "extraPartnerParams")
  override fun setExtraPartnerParams(view: BiometricKycView?, value: String?) {
    view?.extraPartnerParams = DocumentVerificationViewManager.parsePartnerParams(value)
  }

  companion object {
    const val NAME = "BiometricKycView"
  }
}
