package com.rnwrap

import com.facebook.react.module.annotations.ReactModule
import org.json.JSONArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.DocumentVerificationViewManagerDelegate
import com.facebook.react.viewmanagers.DocumentVerificationViewManagerInterface

@ReactModule(name = DocumentVerificationViewManager.NAME)
class DocumentVerificationViewManager :
  SimpleViewManager<DocumentVerificationView>(),
  DocumentVerificationViewManagerInterface<DocumentVerificationView> {

  private val delegate = DocumentVerificationViewManagerDelegate(this)

  override fun getDelegate() = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = DocumentVerificationView(context)

  @ReactProp(name = "countryCode")
  override fun setCountryCode(view: DocumentVerificationView?, value: String?) {
    view?.countryCode = value ?: ""
  }

  @ReactProp(name = "userId")
  override fun setUserId(view: DocumentVerificationView?, value: String?) {
    view?.userId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "jobId")
  override fun setJobId(view: DocumentVerificationView?, value: String?) {
    view?.jobId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "documentType")
  override fun setDocumentType(view: DocumentVerificationView?, value: String?) {
    view?.documentType = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "captureBothSides")
  override fun setCaptureBothSides(view: DocumentVerificationView?, value: Boolean) {
    view?.captureBothSides = value
  }

  @ReactProp(name = "autoCaptureTimeout")
  override fun setAutoCaptureTimeout(view: DocumentVerificationView?, value: Int) {
    view?.autoCaptureTimeout = value.takeIf { it > 0 }
  }

  @ReactProp(name = "autoCapture")
  override fun setAutoCapture(view: DocumentVerificationView?, value: String?) {
    view?.autoCapture = value
  }

  @ReactProp(name = "idAspectRatio")
  override fun setIdAspectRatio(view: DocumentVerificationView?, value: Float) {
    view?.idAspectRatio = value.takeIf { it > 0f }
  }

  @ReactProp(name = "allowAgentMode")
  override fun setAllowAgentMode(view: DocumentVerificationView?, value: Boolean) {
    view?.allowAgentMode = value
  }

  @ReactProp(name = "allowGalleryUpload")
  override fun setAllowGalleryUpload(view: DocumentVerificationView?, value: Boolean) {
    view?.allowGalleryUpload = value
  }

  @ReactProp(name = "allowNewEnroll")
  override fun setAllowNewEnroll(view: DocumentVerificationView?, value: Boolean) {
    view?.allowNewEnroll = value
  }

  @ReactProp(name = "showInstructions")
  override fun setShowInstructions(view: DocumentVerificationView?, value: Boolean) {
    view?.showInstructions = value
  }

  @ReactProp(name = "showAttribution")
  override fun setShowAttribution(view: DocumentVerificationView?, value: Boolean) {
    view?.showAttribution = value
  }

  @ReactProp(name = "useStrictMode")
  override fun setUseStrictMode(view: DocumentVerificationView?, value: Boolean) {
    view?.useStrictMode = value
  }

  @ReactProp(name = "skipApiSubmission")
  override fun setSkipApiSubmission(view: DocumentVerificationView?, value: Boolean) {
    view?.skipApiSubmission = value
  }

  @ReactProp(name = "bypassSelfieCaptureWithFile")
  override fun setBypassSelfieCaptureWithFile(view: DocumentVerificationView?, value: String?) {
    view?.bypassSelfieCaptureWithFile = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "extraPartnerParams")
  override fun setExtraPartnerParams(view: DocumentVerificationView?, value: String?) {
    view?.extraPartnerParams = parsePartnerParams(value)
  }

  companion object {
    const val NAME = "DocumentVerificationView"

    fun parsePartnerParams(json: String?): Map<String, String> {
      if (json.isNullOrEmpty()) return emptyMap()
      return try {
        val arr = JSONArray(json)
        buildMap {
          for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            put(obj.getString("key"), obj.getString("value"))
          }
        }
      } catch (_: Exception) { emptyMap() }
    }
  }
}
