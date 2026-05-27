package com.rnwrap

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RnWrapViewManagerInterface
import com.facebook.react.viewmanagers.RnWrapViewManagerDelegate

@ReactModule(name = RnWrapViewManager.NAME)
class RnWrapViewManager : SimpleViewManager<RnWrapView>(),
  RnWrapViewManagerInterface<RnWrapView> {
  private val mDelegate: ViewManagerDelegate<RnWrapView>

  init {
    mDelegate = RnWrapViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<RnWrapView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): RnWrapView {
    return RnWrapView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: RnWrapView?, color: Int?) {
    view?.setBackgroundColor(color ?: Color.TRANSPARENT)
  }

  companion object {
    const val NAME = "RnWrapView"
  }
}
