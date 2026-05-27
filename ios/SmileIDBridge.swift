import Foundation
import SmileID

@objc public class SmileIDBridge: NSObject {

  @objc public static func initialize(
    useSandbox: Bool,
    enableCrashReporting: Bool,
    config: NSDictionary?,
    resolve: @escaping (Any?) -> Void,
    reject: @escaping (String, String, Error) -> Void
  ) {
    DispatchQueue.main.async {
      do {
        SmileID.setWrapperInfo(name: .reactNative, version: "unknown")

        if let config = config {
          let configData = try JSONSerialization.data(withJSONObject: config)
          let decoded = try JSONDecoder().decode(Config.self, from: configData)
          SmileID.initialize(
            apiKey: nil,
            config: decoded,
            useSandbox: useSandbox,
            enableCrashReporting: enableCrashReporting
          )
        } else {
          guard Bundle.main.url(forResource: "smile_config", withExtension: "json") != nil else {
            reject(
              "SmileID_INIT_ERROR",
              "smile_config.json not found. Pass a config object to initialize().",
              NSError(domain: "SmileID", code: -1, userInfo: nil)
            )
            return
          }
          SmileID.initialize(
            apiKey: nil,
            config: SmileID.getConfig(),
            useSandbox: useSandbox,
            enableCrashReporting: enableCrashReporting
          )
        }
        resolve(nil)
      } catch {
        reject("SmileID_INIT_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc public static func setCallbackUrl(
    _ url: String?,
    resolve: @escaping (Any?) -> Void,
    reject: @escaping (String, String, Error) -> Void
  ) {
    DispatchQueue.main.async {
      if let url = url, let parsed = URL(string: url) {
        SmileID.setCallbackUrl(url: parsed)
      }
      resolve(nil)
    }
  }
}
