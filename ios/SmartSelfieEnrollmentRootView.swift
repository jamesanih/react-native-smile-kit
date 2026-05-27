import SwiftUI
import SmileID

struct SmartSelfieEnrollmentRootView: View {
  let userId: String?
  let jobId: String?
  let allowAgentMode: Bool
  let allowNewEnroll: Bool
  let showAttribution: Bool
  let showInstructions: Bool
  let extraPartnerParams: [String: String]
  let onSuccess: (String) -> Void
  let onError: (String, String?) -> Void

  var body: some View {
    SmileID.smartSelfieEnrollmentScreen(
      userId: userId ?? UUID().uuidString,
      jobId: jobId ?? UUID().uuidString,
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

extension SmartSelfieEnrollmentRootView: SmartSelfieResultDelegate {
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
