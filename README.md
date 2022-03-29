# D2R_24PTR2_Wereform_Calculator
Wereform IAS Calculator for Diablo 2 Resurrected 2.4 PTR2

**Live Calculator:** [https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/](https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/)

This calculator is *theoretically* correct for wereform IAS breakpoints in the second Player Test Realm for Diablo2 Resurrected 2.4, however most of its results have yet to be verified against empirical tests.

Key Assumptions:

- Wereforms now use the ordinary EIAS calculation.
- Wereform skills that use the regular attack animation now have a slowing factor applied based on the ratios of the applicable human form's regular attack animation's length and default speed to the wereform's regular attack animation's length and default speed. The effect of this slowing factor is to equalize the overall duration of the wereform's and human form's regular attacks. (The factor is based on the character's class, so, e.g., a bear-sorc's slowing factor is computed based on the Sorceress's normal attack.)
- It's presently unclear exactly where rounding is taking place inside the slowing factor calculations. Accordingly, this calculator may have a very few breakpoints off by 1 EIAS. However, as of version 1.5, it matches all known empircal test data.
- It's presently unknown how the special starting frame values for Amazon's and Sorceresses interact with the slowing factor. This calculator *assumes* they are applied pro rata. (This needs more testing.)
- It's presently unknown whether a slowing factor is applied to bite attacks. This calculator *assumes* that bite attacks do not have a slowing factor applied. (This needs more testing.)
- Similarly, it's presently unknown whether the slowing factor is calculated differently for the two variants of the normal attack animation when the class's human animation variants have different lengths. This calculator *assumes* only the A1 animation's length is used. (This needs more testing.)
- The EIAS cap is increased to +150 while in wereform, as stated in the patch notes.
- The rollback on Fury has been reduced from 100 to 70. (This is verified by extracting skills.txt from the PTR game data. The "40% faster" in the patch notes is wrong.)
- Feral Rage no longer has its traditional quirk that, if it hit, the animation speed was doubled for the remainder of the animation. It now matches the normal attack animation regardless of whether it hits or misses. (This is verified by testing.)
- Dual wielding behaves differently than before. Summary: Dual wielding is useless.
     - Wereform normal attacks are totally bugged while dual wielding. After one successful attack, every attack will miss until you change weapons, exit wereform, or return to town. (This is verified by testing.)
     - For wereform attack skills while dual wielding, the secondary weapon is not used at all. It never strikes and has no effect on attack speed. (This is verified by testing.)


TODO List:

- More empirical testing.
- Add input knobs for slowing effects.
- Expand calculator to general-purpose IAS calculator for all classes, skills, etc.
- Add breakpoints for FHR, FRB, block timer, FCR.
