import SwiftUI
import SmileID

struct BiometricKycRootView: View {
  let countryCode: String
  let idType: String
  let idNumber: String
  let firstName: String
  let lastName: String
  let userId: String?
  let jobId: String?
  let allowAgentMode: Bool
  let allowNewEnroll: Bool
  let showInstructions: Bool
  let showAttribution: Bool
  let useStrictMode: Bool
  let extraPartnerParams: [String: String]
  let onSuccess: (NSDictionary) -> Void
  let onError: (String, String?) -> Void

  var body: some View {
    let idInfo = IdInfo(
      country: countryCode,
      idType: idType,
      idNumber: idNumber,
      firstName: firstName,
      lastName: lastName,
      entered: true
    )
    SmileID.biometricKycScreen(
      idInfo: idInfo,
      userId: userId ?? UUID().uuidString,
      jobId: jobId ?? UUID().uuidString,
      allowNewEnroll: allowNewEnroll,
      allowAgentMode: allowAgentMode,
      showAttribution: showAttribution,
      showInstructions: showInstructions,
      useStrictMode: useStrictMode,
      extraPartnerParams: extraPartnerParams,
      consentInformation: nil,
      delegate: self
    )
    .edgesIgnoringSafeArea(.all)
  }
}

extension BiometricKycRootView: BiometricKycResultDelegate {
  func didSucceed(selfieImage: URL, livenessImages: [URL], didSubmitBiometricJob: Bool) {
    let livenessStrings = livenessImages.map { $0.absoluteString }
    let livenessJson = (try? JSONSerialization.data(withJSONObject: livenessStrings))
      .flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
    let payload: [String: Any] = [
      "selfieImage": selfieImage.absoluteString,
      "livenessImages": livenessJson,
      "didSubmitBiometricJob": didSubmitBiometricJob,
    ]
    onSuccess(payload as NSDictionary)
  }

  func didError(error: Error) {
    onError(error.localizedDescription, nil)
  }
}
