# D2R_24PTR2_Wereform_Calculator
Wereform IAS Calculator for Diablo 2 Resurrected 2.4 PTR2

**Live Calculator:** [https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/](https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/)

This calculator is *theoretically* correct for wereform IAS breakpoints in the second Player Test Realm for Diablo2 Resurrected 2.4, however most of its results have yet to be verified against empirical tests.

Key Assumptions:

- Wereforms now use the ordinary EIAS calculation.
- The EIAS cap is increased to +150 while in wereform, as stated in the patch notes.
- The rollback on Fury has been reduced from 100 to 70. (This is verified by extracting skills.txt from the PTR game data. The "40% faster" in the patch notes is wrong.)
- Wereform skills that use the regular attack animation now borrow their frame data from the applicable human form's regular attack animation. (E.g., Wereform Druids use the human Druid's frame data; Wolf-Barbs use the Barbarian's frame data; Bear- Sorcs use the Sorceress's frame data; etc.) (This is verifeid by testing.)
= It's assumed that bite attacks still use their traditional frame data because the human forms don't have a bite animation to borrow from. (This needs more testing.)
- Feral Rage retains its traditional quirk that, if it hits, the animation speed is doubled for the remainder of the animation. (This needs more testing.)
- Dual wielding behaves as described in the additional text that appears when selecting Barbarian or Assassin. (Summary: Dual wielding is useless.) (This is verified by testing.)

TODO List:

- Empirical testing.
- Add input knobs for slowing effects.
- Expand calculator to general-purpose IAS calculator for all classes, skills, etc.
- Add action frame breakpoints.
