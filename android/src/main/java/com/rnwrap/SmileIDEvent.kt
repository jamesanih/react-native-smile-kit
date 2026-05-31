package com.rnwrap

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class SmileIDEvent(
  surfaceId: Int,
  viewTag: Int,
  private val eventPropName: String,
  private val payload: WritableMap,
) : Event<SmileIDEvent>(surfaceId, viewTag) {

  override fun getEventName() = eventPropName

  override fun getEventData(): WritableMap = payload
}
