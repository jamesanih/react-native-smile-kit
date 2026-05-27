#import "SmartSelfieAuthenticationView.h"

#import <React/RCTConversions.h>
#import <react/renderer/components/RnWrapViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RnWrapViewSpec/EventEmitters.h>
#import <react/renderer/components/RnWrapViewSpec/Props.h>
#import <react/renderer/components/RnWrapViewSpec/RCTComponentViewHelpers.h>
#import "RCTFabricComponentsPlugins.h"
#import "RnWrap-Swift.h"

using namespace facebook::react;

@implementation SmartSelfieAuthenticationView {
    SmartSelfieAuthenticationViewProvider *_provider;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<SmartSelfieAuthenticationViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const SmartSelfieAuthenticationViewProps>();
        _props = defaultProps;

        _provider = [[SmartSelfieAuthenticationViewProvider alloc] init];

        __weak SmartSelfieAuthenticationView *weakSelf = self;

        _provider.onSuccess = ^(NSString *resultJson) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const SmartSelfieAuthenticationViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            SmartSelfieAuthenticationViewEventEmitter::OnSuccess event;
            event.result = std::string([resultJson UTF8String] ?: "");
            emitter->onSuccess(event);
        };

        _provider.onError = ^(NSString *message, NSString * _Nullable code) {
            auto strongSelf = weakSelf;
            if (!strongSelf) return;
            auto emitter = std::dynamic_pointer_cast<const SmartSelfieAuthenticationViewEventEmitter>(
                strongSelf->_eventEmitter);
            if (!emitter) return;
            SmartSelfieAuthenticationViewEventEmitter::OnError event;
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
    const auto &old = *std::static_pointer_cast<SmartSelfieAuthenticationViewProps const>(_props);
    const auto &next = *std::static_pointer_cast<SmartSelfieAuthenticationViewProps const>(props);

    BOOL needsUpdate = NO;

    if (old.userId != next.userId) {
        _provider.userId = [NSString stringWithUTF8String:next.userId.c_str()];
        needsUpdate = YES;
    }
    if (old.jobId != next.jobId) {
        _provider.jobId = next.jobId.empty() ? nil : [NSString stringWithUTF8String:next.jobId.c_str()];
        needsUpdate = YES;
    }
    if (old.allowAgentMode != next.allowAgentMode) {
        _provider.allowAgentMode = @(next.allowAgentMode);
        needsUpdate = YES;
    }
    if (old.allowNewEnroll != next.allowNewEnroll) {
        _provider.allowNewEnroll = @(next.allowNewEnroll);
        needsUpdate = YES;
    }
    if (old.showAttribution != next.showAttribution) {
        _provider.showAttribution = @(next.showAttribution);
        needsUpdate = YES;
    }
    if (old.showInstructions != next.showInstructions) {
        _provider.showInstructions = @(next.showInstructions);
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

@end
