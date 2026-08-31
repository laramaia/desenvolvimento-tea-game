const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    huge: 48,
};

const FONTS = {
    family: 'Arial, sans-serif',
    size: {
        sm: '16px',
        md: '22px',
        lg: '24px',
        xl: '26px',
        title: '32px',
    },
};

const PALETTE = {
    hex: {
        primary: 0x1C3360,
        primaryHover: 0x2A4C8C,
        primaryDark: 0x203B6E,
        sceneBg: 0x3863AF,
        accent: 0x466ea7,
        success: 0x3A6937,
        error: 0xc62828,
        darkBg: 0x0f172a,
        white: 0xffffff,
        shadow: 0x000000,
    },
    string: {
        primary: '#1C3360',
        primaryHover: '#466ea7',
        white: '#ffffff',
        muted: '#a0a0a0',
        hover: '#ffd700',
        success: '#2e7d32',
        successLight: '#66ff66',
        error: '#c62828',
        errorLight: '#ff6666',
    }
};

const SHADOWS = {
    default: {
        color: PALETTE.hex.shadow,
        alpha: 0.25,
        offsetY: 4,
        blurPasses: 3,
    }
};

export const Theme = {
    backgrounds: {
        map: 'bg-map',
    },
    spacing: SPACING,
    fonts: FONTS,
    colors: PALETTE,
    shadows: SHADOWS,

    textStyles: {
        title: {
            fontSize: FONTS.size.title,
            color: PALETTE.string.white,
            fontStyle: 'bold',
            align: 'center',
        },
        button: {
            fontSize: FONTS.size.md,
            color: PALETTE.string.white,
            fontStyle: 'bold',
            align: 'center',
        },
        optionButton: {
            fontSize: FONTS.size.lg,
            color: PALETTE.string.white,
            backgroundColor: PALETTE.string.primary,
            padding: { x: SPACING.xl, y: SPACING.md },
        },
        backButton: {
            fontSize: FONTS.size.md,
            color: PALETTE.string.white,
            backgroundColor: PALETTE.string.darkBg,
            padding: { x: SPACING.md, y: SPACING.sm },
        },
        feedbackSuccess: {
            fontSize: FONTS.size.xl,
            color: PALETTE.string.successLight,
        },
        feedbackError: {
            fontSize: FONTS.size.xl,
            color: PALETTE.string.errorLight,
        },
        caption: {
            fontSize: FONTS.size.sm,
            color: PALETTE.string.white,
            fontStyle: 'bold',
        },
        subtitle: {
            fontSize: '18px',
            color: PALETTE.string.white,
            fontStyle: 'bold',
        },
    },

    sidebar: {
        widthRatio: 0.20,
        minWidth: 220,
        buttonWidthRatio: 0.8,
        buttonHeightRatio: 0.2,
        buttonGap: 15,
        borderRadius: 15,
        divider: {
            width: 2,
            alpha: 1,
        },
    },

    levelNode: {
        heightRatio: 0.22,
        hoverMultiplier: 1.05,
    },

    hudPanel: {
        bgColor: 0x223D71,
        borderColor: 0x193260,
        borderWidth: 4,
        scaleBaseWidth: 1280,
        cornerRadius: 24,
    },

    coinCounter: {
        iconScale: 0.68,
        fontSize: 48,
        iconGap: 12,
        paddingX: 20,
        paddingY: 12,
        scaleMin: 0.1,
        scaleMax: 1.1,
    },

    mapHeader: {
        iconScale: 0.5,
        paddingX: 24,
        paddingY: 16,
        gapEntreLinhas: 8,
        gapIconeTextos: 14,
        progressoAlpha: 0.6,
        scaleMin: 0.5,
        scaleMax: 1.4,
        chamadaBadge: {
            bgColor: 0x34569A,
            cornerRadius: 6,
            paddingX: 8,
            paddingY: 4,
        },
    },

    toast: {
        iconScale: 0.5,
        paddingX: 24,
        paddingY: 16,
        gapIconeTextos: 14,
        bgColor: 0x203B6E, 
        scaleMin: 0.1,
        scaleMax: 1.05,
    }
};