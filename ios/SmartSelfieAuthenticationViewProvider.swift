import SwiftUI
import SmileID

@objc public class SmartSelfieAuthenticationViewProvider: UIView {

  private var hostingController: UIHostingController<SmartSelfieAuthenticationRootView>?

  @objc public var onSuccess: ((NSString) -> Void)?
  @objc public var onError: ((NSString, NSString?) -> Void)?

  @objc public var userId: NSString = ""
  @objc public var jobId: NSString?
  @objc public var allowAgentMode: NSNumber = false
  @objc public var allowNewEnroll: NSNumber = false
  @objc public var showAttribution: NSNumber = true
  @objc public var showInstructions: NSNumber = true
  @objc public var extraPartnerParams: NSString?

  public override func layoutSubviews() {
    super.layoutSubviews()
    setupViewIfNeeded()
  }

  private func setupViewIfNeeded() {
    guard hostingController == nil else { return }
    let hc = UIHostingController(rootView: buildRootView())
    hc.view.backgroundColor = .clear
    hc.view.frame = bounds
    hc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(hc.view)
    hostingController = hc
  }

  @objc public func updateParams() {
    hostingController?.rootView = buildRootView()
  }

  private func buildRootView() -> SmartSelfieAuthenticationRootView {
    SmartSelfieAuthenticationRootView(
      userId: userId as String,
      allowAgentMode: allowAgentMode.boolValue,
      allowNewEnroll: allowNewEnroll.boolValue,
      showAttribution: showAttribution.boolValue,
      showInstructions: showInstructions.boolValue,
      extraPartnerParams: resolvedPartnerParams(),
      onSuccess: { [weak self] json in self?.onSuccess?(json as NSString) },
      onError: { [weak self] msg, code in self?.onError?(msg as NSString, code as NSString?) }
    )
  }

  private func resolvedPartnerParams() -> [String: String] {
    guard let json = extraPartnerParams as String?,
          let data = json.data(using: .utf8),
          let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: String]]
    else { return [:] }
    var result: [String: String] = [:]
    arr.forEach { if let k = $0["key"], let v = $0["value"] { result[k] = v } }
    return result
  }
}
