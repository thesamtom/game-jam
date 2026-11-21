import type { Appearance, Npc } from '../entities/Npc';
import type { CutsceneRunner } from '../systems/CutsceneRunner';
import type { Point } from './maps/layout';
import type { DialogueId } from './dialogue';

export interface Stage {
  fx: CutsceneRunner;
  focus: Point;
  actor: (role: Appearance, point: Point) => Npc;
  speak: (id: DialogueId) => Promise<void>;
  hide: (roles: Appearance[]) => void;
  setPlayer: (visible: boolean) => void;
  switchIdentity: () => void;
}
export async function enact(id: string, stage: Stage) {
  const { fx, focus, actor, speak, hide, setPlayer, switchIdentity } = stage;
  const position = (dx: number, dy: number): Point => ({ x: focus.x + dx, y: focus.y + dy });
  const shot = async () => {
    fx.flash(190, 255, 255, 255);
    fx.shake(250);
    fx.sound('gunshot');
    await fx.wait(280);
  };
  await fx.run(async () => {
    switch (id) {
      case 'opening':
        await fx.caption('Karimkunnu. A town where everyone knows everyone. Except the people they really are.', 3700, true);
        break;
      case 'childhood': {
        hide(['Raghavan', 'Hamsa']);
        setPlayer(false);
        fx.stage(true);
        await fx.caption('Years earlier, Kuttappan took a boy named Vishnu in.', 2350, true);
        fx.stage(true);
        actor('Young Vishnu', position(-13, 5));
        actor('Kuttappan', position(14, 5));
        await fx.pan(focus, 350);
        await speak('beforeKuttappan');
        hide(['Young Vishnu', 'Kuttappan']);
        actor('Vishnu', position(0, 4));
        await speak('beforeUniform');
        hide(['Vishnu']);
        setPlayer(true);
        break;
      }
      case 'warning':
        await fx.caption('Earlier that evening', 1700, true);
        fx.stage(true);
        setPlayer(false);
        actor('Vishnu', position(-12, 4));
        actor('Kuttappan', position(12, 4));
        actor('Shaji', position(28, 8));
        await fx.pan(focus, 400);
        await speak('warning');
        await fx.caption('Alex is looking for the officer who warned the gang. Vishnu is looking for the gang member who tipped off the police.', 5800, true);
        setPlayer(true);
        break;
      case 'handoff': {
        const officer = actor('Unknown Officer', position(15, -6));
        officer.image.setFlipX(true);
        await fx.pan(focus, 480);
        await speak('handoff');
        await fx.waypoints(officer, [position(27, -12), position(45, -18)], 275);
        hide(['Unknown Officer', 'Kuttappan']);
        break;
      }
      case 'fall': {
        await fx.pan(position(10, -28), 650);
        fx.flash();
        fx.shake(350);
        fx.sound('fall');
        await fx.fade(true);
        hide(['Raghavan', 'Kuttappan', 'Shaji']);
        await fx.caption('Kuttappan’s crew pushed Raghavan off the roof. Alex lost the only person who could vouch for him.', 5100, true);
        break;
      }
      case 'raid': {
        const vishnu = actor('Vishnu', position(31, -18));
        const kuttappan = actor('Kuttappan', position(52, -29));
        await fx.pan(position(35, -19));
        fx.stage(true);
        await speak('raid');
        fx.flash(125, 255, 255, 255);
        fx.sound('gunshot');
        await fx.wait(260);
        await shot();
        await fx.fade(true, 230);
        vishnu.image.setAlpha(.4);
        kuttappan.image.setAlpha(.4);
        await speak('father');
        fx.sound('impact');
        await fx.caption('Vishnu shot Kuttappan. Alex stayed behind cover.', 2600, true);
        await fx.fade(false);
        break;
      }
      case 'praise':
        await fx.caption('Vishnu was commended for bringing down Kuttappan. His report never said how well they knew each other.', 3400, true);
        break;
      case 'proof':
        await fx.fade(true, 340);
        fx.black(true);
        await speak('proof');
        await fx.fade(false, 260);
        break;
      case 'shooting':
        actor('Sudhi', position(34, 8));
        await speak('rooftop');
        await fx.pan(position(16, -17), 350);
        await shot();
        await fx.fade(true, 290);
        fx.black(true);
        setPlayer(false);
        await fx.caption('Sudhi shot Alex.', 1400, true);
        fx.black(false);
        await fx.fade(false, 180);
        await shot();
        await fx.fade(true, 250);
        hide(['Vishnu', 'Sudhi']);
        await fx.caption('Vishnu shot Sudhi.', 1700, true);
        await fx.caption('Alex died on the roof. You now play as Vishnu.', 2600, true);
        switchIdentity();
        setPlayer(true);
        await speak('coverup');
        await fx.fade(false, 400);
        break;
      case 'funeral':
        await fx.caption('Alex was buried in Karimkunnu. There was no police salute.', 3100, true);
        await fx.caption('Meera stood until the others had gone.', 2300, true);
        break;
      case 'ending':
        await speak('home');
        await fx.fade(true, 620);
        fx.black(true);
        await fx.wait(650);
        fx.sound('gunshot');
        await fx.wait(1400);
        await fx.caption('Two spies. One town. Only one survived the rooftop. But the truth was still alive.', 4400, true);
        break;
    }
  });
}
