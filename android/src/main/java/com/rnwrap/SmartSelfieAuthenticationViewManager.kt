package com.rnwrap

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.SmartSelfieAuthenticationViewManagerDelegate
import com.facebook.react.viewmanagers.SmartSelfieAuthenticationViewManagerInterface

@ReactModule(name = SmartSelfieAuthenticationViewManager.NAME)
class SmartSelfieAuthenticationViewManager :
  SimpleViewManager<SmartSelfieAuthenticationView>(),
  SmartSelfieAuthenticationViewManagerInterface<SmartSelfieAuthenticationView> {

  private val delegate = SmartSelfieAuthenticationViewManagerDelegate(this)

  override fun getDelegate() = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) =
    SmartSelfieAuthenticationView(context)

  @ReactProp(name = "userId")
  override fun setUserId(view: SmartSelfieAuthenticationView?, value: String?) {
    view?.userId = value ?: ""
  }

  @ReactProp(name = "jobId")
  override fun setJobId(view: SmartSelfieAuthenticationView?, value: String?) {
    view?.jobId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "allowAgentMode")
  override fun setAllowAgentMode(view: SmartSelfieAuthenticationView?, value: Boolean) {
    view?.allowAgentMode = value
  }

  @ReactProp(name = "allowNewEnroll")
  override fun setAllowNewEnroll(view: SmartSelfieAuthenticationView?, value: Boolean) {
    view?.allowNewEnroll = value
  }

  @ReactProp(name = "showAttribution")
  override fun setShowAttribution(view: SmartSelfieAuthenticationView?, value: Boolean) {
    view?.showAttribution = value
  }

  @ReactProp(name = "showInstructions")
  override fun setShowInstructions(view: SmartSelfieAuthenticationView?, value: Boolean) {
    view?.showInstructions = value
  }

  @ReactProp(name = "extraPartnerParams")
  override fun setExtraPartnerParams(view: SmartSelfieAuthenticationView?, value: String?) {
    view?.extraPartnerParams = DocumentVerificationViewManager.parsePartnerParams(value)
  }

  companion object {
    const val NAME = "SmartSelfieAuthenticationView"
  }
}
