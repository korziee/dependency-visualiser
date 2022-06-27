import { Plant } from "./plant";
import { Water } from "./water";

export class Ground {
  constructor(private readonly water: Water, private readonly plant: Plant) {}

  public async plantG(): Promise<void> {
    this.water.plant();
    console.log("Planting in ground");
  }
}
