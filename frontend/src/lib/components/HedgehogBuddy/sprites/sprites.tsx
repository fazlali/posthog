import hhFall from 'public/hedgehog/sprites/fall.png'
import hhJump from 'public/hedgehog/sprites/jump.png'
import hhSign from 'public/hedgehog/sprites/sign.png'
import hhSpin from 'public/hedgehog/sprites/spin.png'
import hhWalk from 'public/hedgehog/sprites/walk.png'
import hhWave from 'public/hedgehog/sprites/wave.png'
import hhHeatmaps from 'public/hedgehog/sprites/heatmaps.png'
import hhFlag from 'public/hedgehog/sprites/flag.png'
import hhInspect from 'public/hedgehog/sprites/inspect.png'
import hhPhone from 'public/hedgehog/sprites/phone.png'
import hhAction from 'public/hedgehog/sprites/action.png'

import hhBeret from 'public/hedgehog/sprites/accessories/beret.png'
import hhCap from 'public/hedgehog/sprites/accessories/cap.png'
import hhChef from 'public/hedgehog/sprites/accessories/chefs-hat.png'
import hhCowboy from 'public/hedgehog/sprites/accessories/cowboy-hat.png'
import hhPatch from 'public/hedgehog/sprites/accessories/eye-patch.png'
import hhKid from 'public/hedgehog/sprites/accessories/kids-hat.png'
import hhParrot from 'public/hedgehog/sprites/accessories/parrot.png'
import hhParty from 'public/hedgehog/sprites/accessories/party-hat.png'
import hhPineapple from 'public/hedgehog/sprites/accessories/pineapple-hat.png'
import hhSunny from 'public/hedgehog/sprites/accessories/sunglasses.png'
import hhGlasses from 'public/hedgehog/sprites/accessories/glasses.png'
import hhFancy from 'public/hedgehog/sprites/accessories/top-hat.png'
import hhGrad from 'public/hedgehog/sprites/accessories/graduation-hat.png'


export const SPRITE_SIZE = 80
export const SHADOW_HEIGHT = SPRITE_SIZE / 8
export const SPRITE_SHEET_WIDTH = SPRITE_SIZE * 8

type SpriteInfo = {
    /** Number of frames in this sprite sheet */
    frames: number
    /** Path to the sprite sheet */
    img: string
    /** How many times to loop through the sprite sheet before stopping. If not set, will loop forever (so needs custom logic to decide when to end) */
    maxIteration?: number
    /** If set, will force the sprite to always face this direction */
    forceDirection?: 'left' | 'right'
    /** How likely this animation is to be chosen. Higher numbers are more likely. */
    randomChance?: number
}

export const standardAnimations: { [key: string]: SpriteInfo } = {
    stop: {
        img: hhWave,
        frames: 1,
        maxIteration: 50,
        randomChance: 1,
    },
    fall: {
        img: hhFall,
        frames: 9,
        forceDirection: 'left',
        randomChance: 0,
    },
    jump: {
        img: hhJump,
        frames: 10,
        maxIteration: 10,
        randomChance: 2,
    },
    sign: {
        img: hhSign,
        frames: 33,
        maxIteration: 1,
        forceDirection: 'right',
        randomChance: 1,
    },
    spin: {
        img: hhSpin,
        frames: 9,
        maxIteration: 3,
        randomChance: 2,
    },
    walk: {
        img: hhWalk,
        frames: 11,
        maxIteration: 20,
        randomChance: 10,
    },
    wave: {
        img: hhWave,
        frames: 27,
        maxIteration: 1,
        randomChance: 2,
    },
    heatmaps: {
        img: hhHeatmaps,
        frames: 14,
        maxIteration: 1,
        randomChance: 0,
    },
    flag: {
        img: hhFlag,
        frames: 25,
        maxIteration: 1,
        randomChance: 1,
    },
    inspect: {
        img: hhInspect,
        frames: 36,
        maxIteration: 1,
        randomChance: 1,
    },
    phone: {
        img: hhPhone,
        frames: 28,
        maxIteration: 1,
        randomChance: 1,
    },
    action: {
        img: hhAction,
        frames: 8,
        maxIteration: 3,
        randomChance: 1,
    },
}

export const standardAccessories: { [key: string]: any } = {
    beret: {
        img: hhBeret, 
    },
    cap: {
        img: hhCap,
    },
    chef: {
        img: hhChef,
    },
    cowboy: {
        img: hhCowboy,
    },
    eyepatch: {
        img: hhPatch,
    },
    nerdy: {
        img: hhGlasses,
    },
    graduate: {
        img: hhGrad,
    },
    kiddo: {
        img: hhKid,
    },
    parrot: {
        img: hhParrot,
    },
    party: {
        img: hhParty,
    },
    pineapple: {
        img: hhPineapple,
    },
    sunshine: {
        img: hhSunny,
    },
    fancy: {
        img: hhFancy,
    },
}
