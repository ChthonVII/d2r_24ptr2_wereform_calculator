# D2R_24PTR2_Wereform_Calculator
Wereform IAS Calculator for Diablo 2 Resurrected 2.4 PTR2

**Live Calculator:** [https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/](https://chthonvii.github.io/d2r_24ptr2_wereform_calculator/)

 This calculator is for wereform IAS breakpoints in the second Player Test Realm for Diablo2 Resurrected 2.4, and likely for the final 2.4 patch as well.
 As of calculator version 2.0, the results have been reasonably well tested, and the calculator is believed to be 100% correct.

Key Assumptions:

- Wereforms now use the ordinary EIAS calculation.
- Wereform attacks use the animation speed from the applicable human form's normal attack instead of that wereform animation's specified animation speed. A slowing factor is applied based on the ratio of the wereform's normal attack animation's length to the applicable human form's normal attack animation's length. The overall effect of the animation speed swap and the slowing factor is to equalize the overall duration of the wereform's and human form's normal attacks. (This is based on the character's class, so, e.g., a bear-sorc's animation speed and slowing factor are computed based on the Sorceress's normal attack.)
- The same animation speed and slowing factor are used for bite attacks, even though they use a different animation. (Presumably the same is also true of the alternate normal attack animation, in the rare cases where the two normal attack animations' lengths would differ.)
- The special starting frame values for Amazon's and  Sorceresses normal attacks are applied directly to the wereform attacks *without* pro-rating them by the slowing factor. Therefore they are slightly faster than the human form attacks.
- The EIAS cap is increased to +150 while in wereform, as stated in the patch notes.
- The rollback on Fury has been reduced from 100 to 70. (This is verified by extracting skills.txt from the PTR game data. The "40% faster" in the patch notes is wrong.)
- Feral Rage no longer has its traditional quirk that, if it hit, the animation speed was doubled for the remainder of the animation. It now matches the normal attack animation regardless of whether it hits or misses. (This is verified by testing.)
- Dual wielding behaves differently than before. Summary: Dual wielding is useless.
     - Wereform normal attacks are totally bugged while dual wielding. After one successful attack, every attack will miss until you change weapons, exit wereform, or return to town. (This is verified by testing.)
     - For wereform attack skills while dual wielding, the secondary weapon is not used at all. It never strikes and has no effect on attack speed. (This is verified by testing.)
- There has been a small change to the fundamental attack speed calculation,likely due to D2R using a modern C++ version and compiler, that may move some breakpoints by 1 EIAS (relative to their location in legacy D2) when EIAS (excluding the base 100%) is a negative value.

TODO List:

- Add input knobs for slowing effects.
- Expand calculator to general-purpose IAS calculator for all classes, skills, etc.
- Add breakpoints for FHR, FRB, block timer, FCR.

Credits:
- ChthonVII: research, math, code
- Warren1001: empircal testing, math
