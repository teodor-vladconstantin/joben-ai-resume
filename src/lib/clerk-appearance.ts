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
    socialButtonsBlockButton: '!bg-card !border !border-border !text-foreground hover:!bg-border transition-colors duration-150 ease-out',
    socialButtonsBlockButtonText: '!text-foreground font-medium',
    dividerLine: '!bg-border',
    dividerText: '!text-muted-foreground',
    formFieldLabel: '!text-muted-foreground text-xs font-medium',
    formFieldInput: '!bg-card !border-border !text-foreground placeholder:!text-muted-foreground focus:!border-primary !rounded-sm',
    formButtonPrimary: '!bg-primary hover:!bg-primary/90 !text-primary-foreground font-semibold transition-colors duration-150 ease-out',
    footerActionText: '!text-muted-foreground',
    footerActionLink: '!text-foreground font-medium underline decoration-primary decoration-2 underline-offset-2',
    identityPreviewText: '!text-foreground',
    identityPreviewEditButton: '!text-foreground',
    formFieldErrorText: '!text-foreground text-xs',
    alertText: '!text-foreground/80',
    badge: '!bg-primary/10 !text-foreground',

    // UserButton popover and the "Manage account" modal float freely over
    // the page with no wrapper card behind them (unlike SignIn/SignUp,
    // which sit inside AuthShell's own card) -- they need an opaque
    // background of their own instead of inheriting colorBackground/card's
    // transparency above.
    userButtonPopoverCard: '!bg-card !border !border-border',
    userButtonPopoverMain: '!bg-card',
    userButtonPopoverActions: '!bg-card',
    userButtonPopoverActionButton: '!text-foreground hover:!bg-card',
    userButtonPopoverActionButtonText: '!text-foreground',
    userButtonPopoverActionButtonIcon: '!text-muted-foreground',
    userButtonPopoverFooter: '!bg-card',
    modalBackdrop: '!bg-black/70',
    modalContent: '!bg-card !border !border-border',
    navbar: '!bg-card',
    scrollBox: '!bg-card',
    pageScrollBox: '!bg-card',
    profilePage: '!bg-card',

    // These render with Clerk's own hardcoded near-black text
    // (rgb(33,33,38), meant for a light card) instead of picking up
    // colorText/colorTextSecondary -- redundant now that our surface is
    // light too, but harmless to pin explicitly. Same problem repeats
    // throughout the "Manage account" (UserProfile)
    // modal; the rest of that fix (untargetable internal classes) lives
    // in globals.css, scoped through the stable cl-navbar/cl-modalContent
    // parent classes below.
    userPreviewMainIdentifierText: '!text-foreground',
    userPreviewSecondaryIdentifierText: '!text-muted-foreground',
    navbarButtonText: '!text-foreground',
    profileSectionTitleText: '!text-foreground',
  },
}
