
import { pickBy } from 'lodash';
import { RestrictedNumber } from 'restricted-number';
import { nonenumerable } from 'nonenumerable';

import { Item } from './Item';
import { IGame, Stat, IParty, IPet, PetAffinity, PetAttribute, IBuff, IPlayer, PetUpgrade } from '../interfaces';

export class Pet implements IPet {

  @nonenumerable
  private $game: IGame;

  @nonenumerable
  private $player: IPlayer;

  // pet-related vars
  public name: string;
  public level: RestrictedNumber;
  public xp: RestrictedNumber;
  public gender: string;
  public gold: RestrictedNumber;

  public typeName: string;
  public affinity: PetAffinity;
  public attribute: PetAttribute;
  public rating: number;
  public gatherTick: number;

  public upgradeLevels: { [key in PetUpgrade]?: number };

  private stats: any;

  public $party?: IParty;

  init() {

    // validate that important properties exist
    if(!this.level) this.level = new RestrictedNumber(1, 100, 1);
    if(!this.xp) this.xp = new RestrictedNumber(0, 100, 0);
    if(!this.gender) this.gender = 'male';
    if(!this.gold) this.gold = new RestrictedNumber(0, 0, 0);
    if(!this.rating) this.rating = 1;
    if(!this.stats) this.stats = {};
    if(!this.upgradeLevels) this.upgradeLevels = {};

    // reset some aspects
    this.level = new RestrictedNumber(this.level.minimum, this.level.maximum, this.level.__current);
    this.xp = new RestrictedNumber(this.xp.minimum, this.xp.maximum, this.xp.__current);
    this.gold = new RestrictedNumber(this.gold.minimum, this.gold.maximum, this.gold.__current);

    Object.values(PetUpgrade).forEach(upgrade => {
      this.upgradeLevels[upgrade] = this.upgradeLevels[upgrade] || 0;
    });

    this.recalculateStats();
  }

  public toSaveObject(): any {
    return pickBy(this, (value, key) => !key.startsWith('$'));
  }

  async loop(): Promise<void> {
  }

  public getStat(stat: Stat): number {
    return this.stats[stat];
  }

  public canLevelUp(): boolean {
    return !this.level.atMaximum();
  }

  public gainXP(xp = 0, addMyXP = true): number {

    let remainingXP = addMyXP ? Math.floor(xp + this.stats.xp) : xp;
    const totalXP = remainingXP;

    if(remainingXP < 0) {
      this.xp.add(remainingXP);
      return remainingXP;
    }

    while(remainingXP > 0 && this.canLevelUp()) {
      const preAddXP = this.xp.total;
      this.xp.add(remainingXP);

      const xpDiff = this.xp.total - preAddXP;
      remainingXP -= xpDiff;

      this.tryLevelUp();
    }

    return totalXP;
  }

  public spendGold(gold = 0): number {
    return this.gainGold(-gold);
  }

  public gainGold(gold = 0, addMyGold = true): number {

    const remainingGold = addMyGold ? Math.floor(gold + this.stats.gold) : gold;

    if(remainingGold < 0) {
      this.gold.add(remainingGold);
      return remainingGold;
    }

    this.gold.add(remainingGold);

    return remainingGold;
  }

  private calcLevelMaxXP(level: number): number {
    return Math.floor(100 + (50 * Math.pow(level, 1.65)));
  }

  private tryLevelUp(): void {
    if(!this.xp.atMaximum()) return;
    this.level.add(1);

    this.xp.toMinimum();
    this.resetMaxXP();
  }

  public resetMaxXP(): void {
    this.xp.maximum = this.calcLevelMaxXP(this.level.total);
  }

  private addStatTrail(stat: Stat, val: number) {
    if(val === 0) return;

    val = Math.floor(val);

    this.stats[stat] = this.stats[stat] || 0;
    this.stats[stat] += val;
  }

  public recalculateStats(): void {

    this.stats = {};

    // dynamically-calculated
    // first, we do the addition-based adds
    const allStats = Object.keys(Stat).map(key => Stat[key]);
    allStats.forEach(stat => {

      this.stats[stat] = this.stats[stat] || 0;

      // TODO: get equipment stats and add them here

      // make sure it is 0. no super negatives.
      this.stats[stat] = Math.max(0, this.stats[stat]);
    });

    // base values
    this.stats.hp = Math.max(1, this.stats.hp);
    this.stats.xp = Math.max(1, this.stats.xp);
    this.stats.gold = Math.max(0, this.stats.gold);
  }

  public equip(item: Item, failOnInventoryFull = true): boolean {
    /*
    const oldItem = this.$inventory.itemInEquipmentSlot(item.type);
    if(oldItem) {
      const successful = this.unequip(oldItem, failOnInventoryFull);
      if(!successful) return false;
    }

    this.increaseStatistic('Item/Equip/Times', 1);

    this.$inventory.equipItem(item);
    this.recalculateStats();
    */
    return true;
  }

  public unequip(item: Item, failOnInventoryFull = false): boolean {
    /*
    if(failOnInventoryFull && !this.$inventory.canAddItemsToInventory()) return false;

    this.$inventory.unequipItem(item);
    this.recalculateStats();

    this.increaseStatistic('Item/Unequip/Times', 1);

    if(this.$inventory.canAddItemsToInventory()) {
      this.$inventory.addItemToInventory(item);
    } else {
      this.sellItem(item);
    }
    */

    return true;
  }

  public addBuff(buff: IBuff): void {

  }

  public sellItem(item: Item): number {
    const value = item.score;
    const modValue = this.gainGold(value);

    return modValue;
  }

}
