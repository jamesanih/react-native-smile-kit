import SwiftUI
import SmileID

@objc public class BiometricKycViewProvider: UIView {

  private var hostingController: UIHostingController<BiometricKycRootView>?

  @objc public var onSuccess: ((NSDictionary) -> Void)?
  @objc public var onError: ((NSString, NSString?) -> Void)?

  @objc public var countryCode: NSString = ""
  @objc public var idType: NSString = ""
  @objc public var idNumber: NSString = ""
  @objc public var firstName: NSString = ""
  @objc public var lastName: NSString = ""
  @objc public var userId: NSString?
  @objc public var jobId: NSString?
  @objc public var allowAgentMode: NSNumber = false
  @objc public var allowNewEnroll: NSNumber = false
  @objc public var showInstructions: NSNumber = true
  @objc public var showAttribution: NSNumber = true
  @objc public var useStrictMode: NSNumber = false
  @objc public var extraPartnerParams: NSString?

  public override func layoutSubviews() {
    super.layoutSubviews()
    setupViewIfNeeded()
  }

  private func setupViewIfNeeded() {
    guard hostingController == nil else { return }
    let rootView = buildRootView()
    let hc = UIHostingController(rootView: rootView)
    hc.view.backgroundColor = .clear
    hc.view.frame = bounds
    hc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(hc.view)
    hostingController = hc
  }

  @objc public func updateParams() {
    guard let hc = hostingController else { return }
    hc.rootView = buildRootView()
  }

  private func buildRootView() -> BiometricKycRootView {
    BiometricKycRootView(
      countryCode: countryCode as String,
      idType: idType as String,
      idNumber: idNumber as String,
      firstName: firstName as String,
      lastName: lastName as String,
      userId: userId as String?,
      jobId: jobId as String?,
      allowAgentMode: allowAgentMode.boolValue,
      allowNewEnroll: allowNewEnroll.boolValue,
      showInstructions: showInstructions.boolValue,
      showAttribution: showAttribution.boolValue,
      useStrictMode: useStrictMode.boolValue,
      extraPartnerParams: resolvedPartnerParams(),
      onSuccess: { [weak self] payload in self?.onSuccess?(payload) },
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
