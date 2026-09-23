import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSkeletonGrid({ count = 6 }) {
    return (_jsx("div", { className: "grid", "aria-hidden": true, children: Array.from({ length: count }).map((_, i) => (_jsx("div", { className: "skeleton" }, i))) }));
}
