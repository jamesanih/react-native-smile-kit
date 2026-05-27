package com.rnwrap

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.SmartSelfieEnrollmentViewManagerDelegate
import com.facebook.react.viewmanagers.SmartSelfieEnrollmentViewManagerInterface

@ReactModule(name = SmartSelfieEnrollmentViewManager.NAME)
class SmartSelfieEnrollmentViewManager :
  SimpleViewManager<SmartSelfieEnrollmentView>(),
  SmartSelfieEnrollmentViewManagerInterface<SmartSelfieEnrollmentView> {

  private val delegate = SmartSelfieEnrollmentViewManagerDelegate(this)

  override fun getDelegate() = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = SmartSelfieEnrollmentView(context)

  @ReactProp(name = "userId")
  override fun setUserId(view: SmartSelfieEnrollmentView?, value: String?) {
    view?.userId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "jobId")
  override fun setJobId(view: SmartSelfieEnrollmentView?, value: String?) {
    view?.jobId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "allowAgentMode")
  override fun setAllowAgentMode(view: SmartSelfieEnrollmentView?, value: Boolean) {
    view?.allowAgentMode = value
  }

  @ReactProp(name = "allowNewEnroll")
  override fun setAllowNewEnroll(view: SmartSelfieEnrollmentView?, value: Boolean) {
    view?.allowNewEnroll = value
  }

  @ReactProp(name = "showAttribution")
  override fun setShowAttribution(view: SmartSelfieEnrollmentView?, value: Boolean) {
    view?.showAttribution = value
  }

  @ReactProp(name = "showInstructions")
  override fun setShowInstructions(view: SmartSelfieEnrollmentView?, value: Boolean) {
    view?.showInstructions = value
  }

  @ReactProp(name = "extraPartnerParams")
  override fun setExtraPartnerParams(view: SmartSelfieEnrollmentView?, value: String?) {
    view?.extraPartnerParams = DocumentVerificationViewManager.parsePartnerParams(value)
  }

  companion object {
    const val NAME = "SmartSelfieEnrollmentView"
  }
}
