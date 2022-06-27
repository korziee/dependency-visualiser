import { Ground } from "./ground";
import { Water } from "./water";

export class Plant {
  constructor(private readonly ground: Ground, private readonly water: Water) {}

  public async plantInGround(): Promise<void> {
    await this.ground.plantG();
    await this.ground.plantG();
    console.log("planting in ground");
  }

  public async plantInWater(): Promise<void> {
    await this.water.plant();
  }
}
