export const clerkAppearance = {
  variables: {
    colorBackground: 'var(--background)',
    colorInputBackground: 'var(--surface)',
    colorText: 'var(--foreground)',
    colorTextSecondary: 'var(--muted)',
    // Accent only ever appears as a fill with the fixed --accent-ink text on
    // top (see globals.css) — not --foreground, which flips in dark mode.
    colorTextOnPrimaryBackground: 'var(--accent-ink)',
    colorPrimary: 'var(--accent)',
    colorDanger: 'var(--foreground)',
    colorSuccess: 'var(--foreground)',
    colorNeutral: 'var(--foreground)',
    colorInputText: 'var(--foreground)',
    borderRadius: '0px',
    fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    card: '!bg-transparent !shadow-none !border-0 p-0 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: '!bg-(--surface-elevated) !border !border-(--border) !text-(--foreground) hover:!bg-(--border) transition-colors duration-150 ease-out',
    socialButtonsBlockButtonText: '!text-(--foreground) font-medium',
    dividerLine: '!bg-(--border)',
    dividerText: '!text-(--muted)',
    formFieldLabel: '!text-(--muted) text-xs font-medium',
    formFieldInput: '!bg-(--surface) !border-(--border) !text-(--foreground) placeholder:!text-(--muted) focus:!border-(--accent) !rounded-sm',
    formButtonPrimary: '!bg-(--accent) hover:!bg-(--accent-strong) !text-(--accent-ink) font-semibold transition-colors duration-150 ease-out',
    footerActionText: '!text-(--muted)',
    footerActionLink: '!text-(--foreground) font-medium underline decoration-(--accent) decoration-2 underline-offset-2',
    identityPreviewText: '!text-(--foreground)',
    identityPreviewEditButton: '!text-(--foreground)',
    formFieldErrorText: '!text-(--foreground) text-xs',
    alertText: '!text-(--foreground)/80',
    badge: '!bg-(--accent-muted) !text-(--foreground)',

    // UserButton popover and the "Manage account" modal float freely over
    // the page with no wrapper card behind them (unlike SignIn/SignUp,
    // which sit inside AuthShell's own card) -- they need an opaque
    // background of their own instead of inheriting colorBackground/card's
    // transparency above.
    userButtonPopoverCard: '!bg-(--surface) !border !border-(--border)',
    userButtonPopoverMain: '!bg-(--surface)',
    userButtonPopoverActions: '!bg-(--surface)',
    userButtonPopoverActionButton: '!text-(--foreground) hover:!bg-(--surface-elevated)',
    userButtonPopoverActionButtonText: '!text-(--foreground)',
    userButtonPopoverActionButtonIcon: '!text-(--muted)',
    userButtonPopoverFooter: '!bg-(--surface)',
    modalBackdrop: '!bg-black/70',
    modalContent: '!bg-(--surface) !border !border-(--border)',
    navbar: '!bg-(--surface)',
    scrollBox: '!bg-(--surface)',
    pageScrollBox: '!bg-(--surface)',
    profilePage: '!bg-(--surface)',

    // These render with Clerk's own hardcoded near-black text
    // (rgb(33,33,38), meant for a light card) instead of picking up
    // colorText/colorTextSecondary -- redundant now that our surface is
    // light too, but harmless to pin explicitly. Same problem repeats
    // throughout the "Manage account" (UserProfile)
    // modal; the rest of that fix (untargetable internal classes) lives
    // in globals.css, scoped through the stable cl-navbar/cl-modalContent
    // parent classes below.
    userPreviewMainIdentifierText: '!text-(--foreground)',
    userPreviewSecondaryIdentifierText: '!text-(--muted)',
    navbarButtonText: '!text-(--foreground)',
    profileSectionTitleText: '!text-(--foreground)',
  },
}
