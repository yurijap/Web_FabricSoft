const require_clerkRuntimeError = require('../../errors/clerkRuntimeError.js');
const require_method_called = require('../../telemetry/events/method-called.js');
const require_contexts = require('../contexts.js');
let react = require("react");

//#region src/react/hooks/useOAuthDeviceVerification.tsx
const HOOK_NAME = "useOAuthDeviceVerification";
const normalizeUserCode = (userCode) => userCode.toUpperCase().replace(/[-\p{White_Space}]/gu, "");
const createNotReadyError = () => new require_clerkRuntimeError.ClerkRuntimeError("Clerk must be loaded before using OAuth device verification.", { code: "oauth_device_verification_not_ready" });
const createLookupInProgressError = () => new require_clerkRuntimeError.ClerkRuntimeError("An OAuth device verification lookup is already in progress for another code.", { code: "oauth_device_verification_lookup_in_progress" });
const createSubmissionInProgressError = () => new require_clerkRuntimeError.ClerkRuntimeError("Another OAuth device verification decision is already in progress.", { code: "oauth_device_verification_submission_in_progress" });
/**
* Provides state and actions for building a custom OAuth device verification flow.
*
* @returns The current verification state and methods for looking up, approving, denying, or resetting a request.
*
* @example
* ### Look up a device authorization request
*
* ```tsx
* import { useOAuthDeviceVerification } from '@clerk/react';
*
* function CustomDeviceVerification({ userCode }: { userCode: string }) {
*   const { data, isLoading, lookup } = useOAuthDeviceVerification();
*
*   const handleLookup = async () => {
*     await lookup({ userCode });
*   };
*
*   return (
*     <>
*       <button disabled={isLoading} onClick={handleLookup}>Verify code</button>
*       {data && <p>Authorize {data.oauthApplicationName}?</p>}
*     </>
*   );
* }
* ```
*/
function useOAuthDeviceVerification() {
	require_contexts.useAssertWrappedByClerkProvider(HOOK_NAME);
	const clerk = require_contexts.useClerkInstanceContext();
	const [data, setData] = (0, react.useState)();
	const [result, setResult] = (0, react.useState)();
	const [error, setError] = (0, react.useState)(null);
	const [isLoading, setIsLoading] = (0, react.useState)(false);
	const [isSubmitting, setIsSubmitting] = (0, react.useState)(false);
	const pendingLookup = (0, react.useRef)(null);
	const pendingSubmit = (0, react.useRef)(null);
	const generation = (0, react.useRef)(0);
	clerk.telemetry?.record(require_method_called.eventMethodCalled(HOOK_NAME));
	const lookup = (0, react.useCallback)((params) => {
		const oauthApplication = clerk.loaded ? clerk.oauthApplication : void 0;
		if (!oauthApplication) return Promise.reject(createNotReadyError());
		const key = normalizeUserCode(params.userCode);
		if (pendingLookup.current) {
			if (pendingLookup.current.key === key) return pendingLookup.current.promise;
			return Promise.reject(createLookupInProgressError());
		}
		const requestGeneration = generation.current;
		setError(null);
		setData(void 0);
		setResult(void 0);
		setIsLoading(true);
		const request = oauthApplication.lookupDeviceVerification({
			...params,
			userCode: key
		}).then((info) => {
			if (generation.current === requestGeneration) setData(info);
			return info;
		}).catch((err) => {
			if (generation.current === requestGeneration) setError(err);
			throw err;
		}).finally(() => {
			if (pendingLookup.current?.promise === request) pendingLookup.current = null;
			if (generation.current === requestGeneration) setIsLoading(false);
		});
		pendingLookup.current = {
			key,
			promise: request
		};
		return request;
	}, [clerk]);
	const submit = (0, react.useCallback)((params, approved) => {
		const oauthApplication = clerk.loaded ? clerk.oauthApplication : void 0;
		if (!oauthApplication) return Promise.reject(createNotReadyError());
		const userCode = normalizeUserCode(params.userCode);
		const key = JSON.stringify([
			userCode,
			params.organizationId ?? null,
			approved
		]);
		if (pendingSubmit.current) {
			if (pendingSubmit.current.key === key) return pendingSubmit.current.promise;
			return Promise.reject(createSubmissionInProgressError());
		}
		const requestGeneration = generation.current;
		setError(null);
		setIsSubmitting(true);
		const request = oauthApplication.submitDeviceVerification({
			...params,
			userCode,
			approved
		}).then((decision) => {
			if (generation.current === requestGeneration) setResult(decision);
			return decision;
		}).catch((err) => {
			if (generation.current === requestGeneration) setError(err);
			throw err;
		}).finally(() => {
			if (pendingSubmit.current?.promise === request) pendingSubmit.current = null;
			if (generation.current === requestGeneration) setIsSubmitting(false);
		});
		pendingSubmit.current = {
			key,
			promise: request
		};
		return request;
	}, [clerk]);
	return {
		data,
		result,
		error,
		isLoading,
		isSubmitting,
		lookup,
		approve: (0, react.useCallback)((params) => submit(params, true), [submit]),
		deny: (0, react.useCallback)((params) => submit(params, false), [submit]),
		reset: (0, react.useCallback)(() => {
			generation.current += 1;
			pendingLookup.current = null;
			setData(void 0);
			setResult(void 0);
			setError(null);
			setIsLoading(false);
			setIsSubmitting(false);
		}, [])
	};
}

//#endregion
exports.useOAuthDeviceVerification = useOAuthDeviceVerification;