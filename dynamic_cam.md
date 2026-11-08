Dynamic Follow-Offset Scaling (Distance & Target Shift)
Even with a corrected FOV, a character centered on a desktop screen can take up too much vertical real estate on a mobile screen, especially if you have on-screen touch joysticks or UI drawers at the bottom.

Boom Arm Length (Z-Distance): Interpolate (lerp) your camera's follow distance based on the aspect ratio. Pulling the camera back by 20% to 35% on portrait screens gives the player breathing room to see obstacles around the character.

Look-At Target Height (Y-Offset): On portrait screens, raise the lookAt target slightly above the character's head. This pushes the character into the lower third of the screen, opening up a clear view of the portfolio exhibits ahead and making room for thumb controls at the bottom.

Over-the-Shoulder (X-Offset): If your camera uses an asymmetric horizontal offset (like a modern action RPG), gradually center that X-offset to 0 as the screen narrows so the character doesn't get pushed off the edge of a phone screen.