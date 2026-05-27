import SwiftUI
import SmileID

@objc public class DocumentVerificationViewProvider: UIView {

  private var hostingController: UIHostingController<DocumentVerificationRootView>?

  @objc public var onSuccess: ((NSDictionary) -> Void)?
  @objc public var onError: ((NSString, NSString?) -> Void)?

  @objc public var countryCode: NSString = ""
  @objc public var userId: NSString?
  @objc public var jobId: NSString?
  @objc public var documentType: NSString?
  @objc public var captureBothSides: NSNumber = true
  @objc public var autoCaptureTimeout: NSNumber = 10
  @objc public var autoCapture: NSString = "AutoCapture"
  @objc public var idAspectRatio: NSNumber?
  @objc public var allowAgentMode: NSNumber = false
  @objc public var allowGalleryUpload: NSNumber = false
  @objc public var allowNewEnroll: NSNumber = false
  @objc public var showInstructions: NSNumber = true
  @objc public var showAttribution: NSNumber = true
  @objc public var useStrictMode: NSNumber = false
  @objc public var skipApiSubmission: NSNumber = false
  @objc public var bypassSelfieCaptureWithFile: NSString?
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

  private func buildRootView() -> DocumentVerificationRootView {
    DocumentVerificationRootView(
      countryCode: countryCode as String,
      userId: userId as String?,
      jobId: jobId as String?,
      documentType: documentType as String?,
      captureBothSides: captureBothSides.boolValue,
      autoCaptureTimeout: autoCaptureTimeout.doubleValue,
      autoCapture: autoCapture as String,
      idAspectRatio: idAspectRatio?.doubleValue,
      allowAgentMode: allowAgentMode.boolValue,
      allowGalleryUpload: allowGalleryUpload.boolValue,
      allowNewEnroll: allowNewEnroll.boolValue,
      showInstructions: showInstructions.boolValue,
      showAttribution: showAttribution.boolValue,
      useStrictMode: useStrictMode.boolValue,
      skipApiSubmission: skipApiSubmission.boolValue,
      bypassSelfieCaptureWithFile: bypassSelfieCaptureWithFile as String?,
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
