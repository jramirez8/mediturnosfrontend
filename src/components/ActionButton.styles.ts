export type ButtonVariant = "primary" | "secondary" | "danger" | "disabled";

export const getButtonStyle = (variant: ButtonVariant, isDark: boolean) => {
  if (variant === "primary") {
    return {
      backgroundColor: isDark ? "#B78CFF" : "#8B35F6",
      borderColor: "transparent",
    };
  }

  if (variant === "secondary") {
    return {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F3ECFF",
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(126,58,242,0.22)",
    };
  }

  if (variant === "danger") {
    return {
      backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
      borderColor: "rgba(220,38,38,0.65)",
    };
  }

  return {
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(126,58,242,0.16)",
    borderColor: "transparent",
    opacity: 0.65,
  };
};

export const getButtonTextStyle = (variant: ButtonVariant, isDark: boolean) => {
  if (variant === "primary") {
    return { color: "#FFFFFF", fontWeight: "800" as const };
  }

  if (variant === "secondary") {
    return { color: isDark ? "#D9C8FF" : "#6D28D9", fontWeight: "800" as const };
  }

  if (variant === "danger") {
    return { color: isDark ? "#FFB4B4" : "#B91C1C", fontWeight: "800" as const };
  }

  return { color: isDark ? "#D8CCF5" : "#7C6E9A", fontWeight: "800" as const };
};

export const baseActionButtonStyle = {
  minHeight: 56,
  borderRadius: 22,
  borderWidth: 1,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingHorizontal: 18,
  shadowColor: "#2D145F",
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
