import SwiftUI
import SmileID

struct DocumentVerificationRootView: View {
  let countryCode: String
  let userId: String?
  let jobId: String?
  let documentType: String?
  let captureBothSides: Bool
  let autoCaptureTimeout: Double
  let autoCapture: String
  let idAspectRatio: Double?
  let allowAgentMode: Bool
  let allowGalleryUpload: Bool
  let allowNewEnroll: Bool
  let showInstructions: Bool
  let showAttribution: Bool
  let useStrictMode: Bool
  let skipApiSubmission: Bool
  let bypassSelfieCaptureWithFile: String?
  let extraPartnerParams: [String: String]
  let onSuccess: (NSDictionary) -> Void
  let onError: (String, String?) -> Void

  var body: some View {
    SmileID.documentVerificationScreen(
      userId: userId ?? UUID().uuidString,
      jobId: jobId ?? UUID().uuidString,
      allowNewEnroll: allowNewEnroll,
      countryCode: countryCode,
      documentType: documentType,
      idAspectRatio: idAspectRatio,
      captureBothSides: captureBothSides,
      allowAgentMode: allowAgentMode,
      allowGalleryUpload: allowGalleryUpload,
      showInstructions: showInstructions,
      showAttribution: showAttribution,
      skipApiSubmission: skipApiSubmission,
      useStrictMode: useStrictMode,
      extraPartnerParams: extraPartnerParams,
      delegate: self
    )
    .edgesIgnoringSafeArea(.all)
  }
}

extension DocumentVerificationRootView: DocumentVerificationResultDelegate {
  func didSucceed(
    selfie: URL,
    documentFrontImage: URL,
    documentBackImage: URL?,
    didSubmitDocumentVerificationJob: Bool
  ) {
    let payload: [String: Any] = [
      "selfie": selfie.absoluteString,
      "documentFrontFile": documentFrontImage.absoluteString,
      "documentBackFile": documentBackImage?.absoluteString ?? "",
      "didSubmitDocumentVerificationJob": didSubmitDocumentVerificationJob,
    ]
    onSuccess(payload as NSDictionary)
  }

  func didError(error: Error) {
    onError(error.localizedDescription, nil)
  }
}
