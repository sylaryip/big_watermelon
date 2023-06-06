import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  EventTouch,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  tween,
  UITransform,
  Vec3,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('game')
export class Game extends Component {
  @property({ type: [Prefab] })
  blockArr = [];

  @property({ type: Node })
  showBlockNode: Node;

  @property({ type: Node })
  scoreNode: Node;

  prepareBlockSeq: number;
  score = 0;

  private boom: AudioClip = null!;
  private knock: AudioClip = null!;

  kLimitHeight = 300;

  init() {
    this.showBlockNode.active = false;
    this.prepareBlockSeq = 1;

    this.showPrepareBlock();
  }

  showPrepareBlock() {
    this.showBlockNode.active = true;

    this.showBlockNode.setPosition(0, 530);
    this.showBlockNode.parent = this.node;
    const children = this.showBlockNode.children;

    for (let i = 0; i < children.length; i++) {
      if (children[i].name == `show_fruit_${this.prepareBlockSeq}`) {
        children[i].active = true;
      } else {
        children[i].active = false;
      }
    }

    tween(this.showBlockNode)
      .to(0.1, { scale: new Vec3(0, 0, 0) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .delay(0.1)
      .start();

    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
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
    const v2TouchStart = event.getUILocation();
    const v3TouchStart = this.node
      .getComponent(UITransform)
      .convertToNodeSpaceAR(new Vec3(v2TouchStart.x, v2TouchStart.y, 0));
    this.showBlockNode.setPosition(v3TouchStart.x, 530);
  }

  onTouchMove(event: EventTouch) {
    if (!this.showBlockNode.active) return;

    const v2TouchMove = event.getUILocation();
    const v3TouchMove = this.node
      .getComponent(UITransform)
      .convertToNodeSpaceAR(new Vec3(v2TouchMove.x, v2TouchMove.y, 0));
    this.showBlockNode.setPosition(v3TouchMove.x, 530);
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
    if (!this.showBlockNode.active) return;
    this.showBlockNode.active = false;
    const posBlockShow = this.showBlockNode.getPosition();
    this.createBlock(this.prepareBlockSeq, posBlockShow, false);
    this.prepareBlockSeq = Math.floor(Math.random() * 5) + 1;

    this.scheduleOnce(() => {
      this.showPrepareBlock();
    }, 1);
  }

  playBoom() {
    this.getComponent(AudioSource)?.playOneShot(this.boom);
  }
  playKnock() {
    this.getComponent(AudioSource)?.playOneShot(this.knock);
  }

  addScore(score: number) {
    this.score += score;
    this.scoreNode.getComponent(Label).string = this.score.toString();
  }
}
