import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  EventTouch,
  find,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  Sprite,
  SpriteAtlas,
  tween,
  UITransform,
  Vec3,
} from 'cc';
import { Block } from './block';
const { ccclass, property } = _decorator;

@ccclass('game')
export class Game extends Component {
  @property({ type: [Prefab] })
  blockArr = [];

  prepareBlockNode: Node;

  @property({ type: Node })
  scoreNode: Node;

  @property({ type: Node })
  lineNode: Node;

  @property({ type: Node })
  gameOverNode: Node;

  prepareBlockSeq: number;
  score = 0;

  private boom: AudioClip = null!;
  private knock: AudioClip = null!;

  kLimitHeight = 430;
  kWarningHeight = 280;
  spriteAtlas: SpriteAtlas;

  get isGameOver(): boolean {
    return this.gameOverNode.active;
  }

  init() {
    this.prepareBlockNode = find('Canvas/prepare_block');
    this.spriteAtlas = this.prepareBlockNode.getComponent(Sprite).spriteAtlas;
    this.prepareBlockSeq = 1;

    this.gameOverNode.active = false;
    this.lineNode.active = false;

    this.score = 0;
    this.scoreNode.getComponent(Label).string = this.score.toString();
    this.cleanupBlocks();

    this.showPrepareBlock();

    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  showPrepareBlock() {
    this.prepareBlockNode.active = true;
    this.prepareBlockNode.setPosition(0, 530);
    this.prepareBlockNode.getComponent(Sprite).spriteFrame =
      this.spriteAtlas.getSpriteFrame('fruit_' + this.prepareBlockSeq);

    tween(this.prepareBlockNode)
      .to(0.1, { scale: new Vec3(0, 0, 0) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .delay(0.1)
      .start();
  }

  start() {
    this.init();
    resources.load('boom', AudioClip, (err, clip) => {
      this.boom = clip;
    });
    resources.load('knock', AudioClip, (err, clip) => {
      this.knock = clip;
    });
  }

  onTouchStart(event: EventTouch) {
    if (this.isGameOver) return;
    const v2TouchStart = event.getUILocation();
    const v3TouchStart = this.node
      .getComponent(UITransform)
      .convertToNodeSpaceAR(new Vec3(v2TouchStart.x, v2TouchStart.y, 0));
    this.prepareBlockNode.setPosition(v3TouchStart.x, 530);
  }

  onTouchMove(event: EventTouch) {
    if (this.isGameOver) return;
    if (!this.prepareBlockNode.active) return;

    const v2TouchMove = event.getUILocation();
    const v3TouchMove = this.node
      .getComponent(UITransform)
      .convertToNodeSpaceAR(new Vec3(v2TouchMove.x, v2TouchMove.y, 0));
    this.prepareBlockNode.setPosition(v3TouchMove.x, 530);
  }

  createBlock(seq: number, pos: Vec3, canScale: boolean) {
    const nodeBlock = instantiate(this.blockArr[seq - 1]);
    nodeBlock.parent = this.node.getChildByName('block');
    nodeBlock.setPosition(pos);

    if (canScale) {
      tween(nodeBlock)
        .to(0.1, { scale: new Vec3(0.5, 0.5, 0.5) })
        .to(0.1, { scale: new Vec3(1, 1, 1) })
        .start();
    }
  }

  onTouchEnd(event: EventTouch) {
    if (this.isGameOver) return;
    if (!this.prepareBlockNode.active) return;
    this.prepareBlockNode.active = false;
    const posBlockShow = this.prepareBlockNode.getPosition();
    this.createBlock(this.prepareBlockSeq, posBlockShow, false);
    this.prepareBlockSeq = Math.floor(Math.random() * 5) + 1;

    this.scheduleOnce(() => {
      this.showPrepareBlock();
    }, 0.75);
  }

  playBoom() {
    this.getComponent(AudioSource)?.playOneShot(this.boom);
  }
  playKnock() {
    this.getComponent(AudioSource)?.playOneShot(this.knock);
  }

  update() {
    this.detectBlocksHeight();
  }
  detectBlocksHeight() {
    const blockNode = this.node.getChildByName('block');

    const children = blockNode.children;
    for (let i = 0; i < children.length; i++) {
      const block = children[i].getComponent(Block);
      if (!block.isCollided) continue;
      const pos = children[i].getPosition();
      if (pos.y > this.kLimitHeight) {
        this.gameOver();
      }
      if (pos.y > this.kWarningHeight) {
        this.showLine();
      } else {
        this.hideLine();
      }
    }
  }
  cleanupBlocks() {
    const blockNode = this.node.getChildByName('block');
    blockNode.removeAllChildren();
  }
  hideLine() {
    this.lineNode.active = false;
  }
  showLine() {
    this.lineNode.active = true;
  }
  gameOver() {
    this.scheduleOnce(() => {
      this.gameOverNode.active = true;
      this.lineNode.active = false;
      this.gameOverNode.getChildByName('score').getComponent(Label).string =
        this.score.toString();
    }, 1);
  }

  addScore(score: number) {
    this.score += score;
    this.scoreNode.getComponent(Label).string = this.score.toString();
  }
}
