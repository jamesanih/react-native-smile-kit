package com.rnwrap

import android.annotation.SuppressLint
import android.content.Context
import androidx.activity.ComponentActivity
import androidx.annotation.UiThread
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.AbstractComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper

abstract class SmileIDComposeHostView @JvmOverloads constructor(
  context: Context,
  private val shouldUseAndroidLayout: Boolean = false,
) : AbstractComposeView(context) {

  private var customViewModelStore: ViewModelStore? = null

  init {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnDetachedFromWindow)
    setupViewTreeOwners()
  }

  private fun setupViewTreeOwners() {
    // In React Native, context is ThemedReactContext — unwrap to the real activity.
    val activity = (context as? ReactContext)?.currentActivity as? ComponentActivity
      ?: context as? ComponentActivity

    if (activity != null) {
      setViewTreeViewModelStoreOwner(activity)
      setViewTreeLifecycleOwner(activity)
      setViewTreeSavedStateRegistryOwner(activity)
    } else {
      customViewModelStore = ViewModelStore()
      setViewTreeViewModelStoreOwner(object : ViewModelStoreOwner {
        override val viewModelStore: ViewModelStore get() = customViewModelStore!!
      })
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    customViewModelStore?.clear()
    customViewModelStore = null
  }

  @Composable
  abstract override fun Content()

  fun dispatchDirectEvent(eventPropName: String, payload: WritableMap) {
    val reactContext = context as? ReactContext ?: return
    val surfaceId = UIManagerHelper.getSurfaceId(this)
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id) ?: return
    dispatcher.dispatchEvent(SmileIDEvent(surfaceId, id, eventPropName, payload))
  }

  override fun requestLayout() {
    super.requestLayout()
    if (shouldUseAndroidLayout) {
      post { measureAndLayout() }
    }
  }

  @UiThread
  @SuppressLint("WrongThread")
  fun measureAndLayout() {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
    )
    layout(left, top, right, bottom)
  }
}
