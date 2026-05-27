#import "BiometricKycView.h"

#import <React/RCTConversions.h>
#import <react/renderer/components/RnWrapViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RnWrapViewSpec/EventEmitters.h>
#import <react/renderer/components/RnWrapViewSpec/Props.h>
#import <react/renderer/components/RnWrapViewSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"
#import "RnWrap-Swift.h"

using namespace facebook::react;

@implementation BiometricKycView {
    BiometricKycViewProvider *_provider;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<BiometricKycViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const BiometricKycViewProps>();
        _props = defaultProps;

        _provider = [[BiometricKycViewProvider alloc] init];

        __weak BiometricKycView *weakSelf = self;

        _provider.onSuccess = ^(NSDictionary *payload) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const BiometricKycViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            BiometricKycViewEventEmitter::OnSuccess event;
            event.selfieImage = std::string([[payload[@"selfieImage"] description] UTF8String] ?: "");
            event.livenessImages = std::string([[payload[@"livenessImages"] description] UTF8String] ?: "[]");
            event.didSubmitBiometricJob = [payload[@"didSubmitBiometricJob"] boolValue];
            emitter->onSuccess(event);
        };

        _provider.onError = ^(NSString *message, NSString * _Nullable code) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const BiometricKycViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            BiometricKycViewEventEmitter::OnError event;
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
    const auto &old = *std::static_pointer_cast<BiometricKycViewProps const>(_props);
    const auto &next = *std::static_pointer_cast<BiometricKycViewProps const>(props);

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
    ASSIGN_STRING(idType, idType)
    ASSIGN_STRING(idNumber, idNumber)
    ASSIGN_STRING(firstName, firstName)
    ASSIGN_STRING(lastName, lastName)
    ASSIGN_STRING(userId, userId)
    ASSIGN_STRING(jobId, jobId)
    ASSIGN_BOOL(allowAgentMode, allowAgentMode)
    ASSIGN_BOOL(allowNewEnroll, allowNewEnroll)
    ASSIGN_BOOL(showInstructions, showInstructions)
    ASSIGN_BOOL(showAttribution, showAttribution)
    ASSIGN_BOOL(useStrictMode, useStrictMode)
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
