import { Game } from './game';
import {
  _decorator,
  Collider2D,
  Component,
  Contact2DType,
  find,
  IPhysics2DContact,
  math,
  tween,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('block')
export class Block extends Component {
  gameScript: Game = null;
  pos: math.Vec3 = null;
  isUpScaling = false;
  isCollided = false;

  onLoad() {
    this.gameScript = find('Canvas').getComponent('game') as Game;
  }
  start() {
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  detectSameBlock(selfCollider: Collider2D, otherCollider: Collider2D) {
    return otherCollider.tag > 0 && selfCollider.tag === otherCollider.tag;
  }

  calcNewBlockPos(selfPos: math.Vec3, otherPos: math.Vec3) {
    let pos = selfPos;
    if (pos.y > otherPos.y) {
      pos = otherPos;
    }

    return pos;
  }

  onBeginContact(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    if (this.gameScript.isGameOver) return;

    this.isCollided = true;
    if (this.isUpScaling) return;
    if (!this.detectSameBlock(selfCollider, otherCollider)) return;

    const scaleBlock = selfCollider.tag + 1;
    const selfPos = selfCollider.node.getPosition();
    const otherPos = otherCollider.node.getPosition();

    this.pos = this.calcNewBlockPos(selfPos, otherPos);

    tween(selfCollider.node).delay(0.05).removeSelf().start();

    this.isUpScaling = true;

    if (selfCollider.uuid > otherCollider.uuid) {
      setTimeout(() => {
        this.gameScript.playBoom();
        this.gameScript.addScore(selfCollider.tag);
        this.gameScript.createBlock(scaleBlock, this.pos, true);
      }, 100);
    }
  }
}
