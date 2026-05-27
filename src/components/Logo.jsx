export default function Logo({ size = 32 }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="64" height="64" rx="12" fill="#000000" stroke="#1f2937" strokeWidth="1" />
                <circle cx="32" cy="30" r="22" fill="#22c55e" />
                <text
                    x="32"
                    y="42"
                    fontFamily="sans-serif"
                    fontSize="28"
                    fontWeight="700"
                    fill="#000000"
                    textAnchor="middle"
                >
                    S
                </text>
                <circle cx="47" cy="12" r="8" fill="#ffffff" />
                <text
                    x="47"
                    y="17"
                    fontFamily="sans-serif"
                    fontSize="9"
                    fontWeight="700"
                    fill="#22c55e"
                    textAnchor="middle"
                >
                    ✓
                </text>
            </svg>
            <span style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: "-0.5px"
            }}>
                Shophala
            </span>
        </div>
    );
}