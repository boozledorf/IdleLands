
import { ICombatSkillCombinator, Stat } from '../../interfaces';
import { Targetting, Description, Targets, EffectsPerTarget, Accuracy, StatMod } from '../skillcomponents';
import { RandomNumber } from '../skillcomponents/RandomNumber';

export const Attack: ICombatSkillCombinator[] = [
  Description('%player attacked %target for %damage damage!'),
  Targets(Targetting.SingleEnemy),
  EffectsPerTarget(1),
  Accuracy(90),
  StatMod(Stat.HP, RandomNumber(0, (attacker, defender) => defender.stats[Stat.HP] / 2))
];
