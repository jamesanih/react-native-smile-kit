import SwiftUI
import SmileID

struct SmartSelfieAuthenticationRootView: View {
  let userId: String
  let allowAgentMode: Bool
  let allowNewEnroll: Bool
  let showAttribution: Bool
  let showInstructions: Bool
  let extraPartnerParams: [String: String]
  let onSuccess: (String) -> Void
  let onError: (String, String?) -> Void

  var body: some View {
    SmileID.smartSelfieAuthenticationScreen(
      userId: userId,
      allowNewEnroll: allowNewEnroll,
      allowAgentMode: allowAgentMode,
      showAttribution: showAttribution,
      showInstructions: showInstructions,
      extraPartnerParams: extraPartnerParams,
      delegate: self
    )
    .edgesIgnoringSafeArea(.all)
  }
}

extension SmartSelfieAuthenticationRootView: SmartSelfieResultDelegate {
  func didSucceed(
    selfieImage: URL,
    livenessImages: [URL],
    apiResponse: SmartSelfieResponse?
  ) {
    let payload: [String: Any] = [
      "selfieFile": selfieImage.absoluteString,
      "livenessFiles": livenessImages.map { $0.absoluteString },
    ]
    if let data = try? JSONSerialization.data(withJSONObject: payload),
       let json = String(data: data, encoding: .utf8) {
      onSuccess(json)
    }
  }

  func didError(error: Error) {
    onError(error.localizedDescription, nil)
  }
}
