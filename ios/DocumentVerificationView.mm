#import "DocumentVerificationView.h"

#import <React/RCTConversions.h>
#import <react/renderer/components/RnWrapViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RnWrapViewSpec/EventEmitters.h>
#import <react/renderer/components/RnWrapViewSpec/Props.h>
#import <react/renderer/components/RnWrapViewSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"
#import "RnWrap-Swift.h"

using namespace facebook::react;

@implementation DocumentVerificationView {
    DocumentVerificationViewProvider *_provider;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<DocumentVerificationViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const DocumentVerificationViewProps>();
        _props = defaultProps;

        _provider = [[DocumentVerificationViewProvider alloc] init];

        __weak DocumentVerificationView *weakSelf = self;

        _provider.onSuccess = ^(NSDictionary *payload) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const DocumentVerificationViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            DocumentVerificationViewEventEmitter::OnSuccess event;
            event.selfie = std::string([[payload[@"selfie"] description] UTF8String] ?: "");
            event.documentFrontFile = std::string([[payload[@"documentFrontFile"] description] UTF8String] ?: "");
            event.documentBackFile = payload[@"documentBackFile"]
                ? std::string([[payload[@"documentBackFile"] description] UTF8String])
                : std::string("");
            event.didSubmitDocumentVerificationJob = [payload[@"didSubmitDocumentVerificationJob"] boolValue];
            emitter->onSuccess(event);
        };

        _provider.onError = ^(NSString *message, NSString * _Nullable code) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const DocumentVerificationViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            DocumentVerificationViewEventEmitter::OnError event;
            event.message = std::string([message UTF8String] ?: "");
            event.code = code ? std::string([code UTF8String]) : std::string("");
            emitter->onError(event);
        };

        self.contentView = _provider;
    }
    return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &old = *std::static_pointer_cast<DocumentVerificationViewProps const>(_props);
    const auto &next = *std::static_pointer_cast<DocumentVerificationViewProps const>(props);

    BOOL needsUpdate = NO;

#define ASSIGN_STRING(field, providerProp) \
    if (old.field != next.field) { \
        _provider.providerProp = next.field.empty() ? nil \
            : [NSString stringWithUTF8String:next.field.c_str()]; \
        needsUpdate = YES; \
    }

#define ASSIGN_BOOL(field, providerProp) \
    if (old.field != next.field) { \
        _provider.providerProp = @(next.field); \
        needsUpdate = YES; \
    }

    ASSIGN_STRING(countryCode, countryCode)
    ASSIGN_STRING(userId, userId)
    ASSIGN_STRING(jobId, jobId)
    ASSIGN_STRING(documentType, documentType)
    ASSIGN_STRING(bypassSelfieCaptureWithFile, bypassSelfieCaptureWithFile)
    ASSIGN_BOOL(captureBothSides, captureBothSides)
    ASSIGN_BOOL(allowAgentMode, allowAgentMode)
    ASSIGN_BOOL(allowGalleryUpload, allowGalleryUpload)
    ASSIGN_BOOL(allowNewEnroll, allowNewEnroll)
    ASSIGN_BOOL(showInstructions, showInstructions)
    ASSIGN_BOOL(showAttribution, showAttribution)
    ASSIGN_BOOL(useStrictMode, useStrictMode)
    ASSIGN_BOOL(skipApiSubmission, skipApiSubmission)

    if (old.autoCaptureTimeout != next.autoCaptureTimeout) {
        _provider.autoCaptureTimeout = @(next.autoCaptureTimeout);
        needsUpdate = YES;
    }
    if (old.idAspectRatio != next.idAspectRatio) {
        _provider.idAspectRatio = next.idAspectRatio > 0 ? @(next.idAspectRatio) : nil;
        needsUpdate = YES;
    }
    if (old.autoCapture != next.autoCapture) {
        switch (next.autoCapture) {
            case DocumentVerificationViewAutoCapture::ManualCaptureOnly:
                _provider.autoCapture = @"ManualCaptureOnly";
                break;
            default:
                _provider.autoCapture = @"AutoCapture";
                break;
        }
        needsUpdate = YES;
    }
    if (old.extraPartnerParams != next.extraPartnerParams) {
        _provider.extraPartnerParams = next.extraPartnerParams.empty() ? nil
            : [NSString stringWithUTF8String:next.extraPartnerParams.c_str()];
        needsUpdate = YES;
    }

    if (needsUpdate) {
        [_provider updateParams];
    }

    [super updateProps:props oldProps:oldProps];
}

#undef ASSIGN_STRING
#undef ASSIGN_BOOL

@end
