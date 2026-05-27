#import "SmileIDModule.h"
#import "RnWrap-Swift.h"

@implementation SmileIDModule

RCT_EXPORT_MODULE(SmileID)

- (void)initialize:(BOOL)useSandbox
enableCrashReporting:(BOOL)enableCrashReporting
            config:(NSDictionary *)config
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
    @try {
        [SmileIDBridge initializeWithUseSandbox:useSandbox
                           enableCrashReporting:enableCrashReporting
                                         config:config
                                        resolve:^(id result) { resolve(result); }
                                         reject:^(NSString *code, NSString *msg, NSError *err) {
            reject(code, msg, err);
        }];
    } @catch (NSException *e) {
        reject(@"SmileID_INIT_ERROR", e.reason ?: e.name, nil);
    }
}

- (void)setCallbackUrl:(NSString *)url
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
    @try {
        [SmileIDBridge setCallbackUrl:url
                              resolve:^(id result) { resolve(result); }
                               reject:^(NSString *code, NSString *msg, NSError *err) {
            reject(code, msg, err);
        }];
    } @catch (NSException *e) {
        reject(@"SmileID_CALLBACK_ERROR", e.reason ?: e.name, nil);
    }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSmileIDSpecJSI>(params);
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

@end
