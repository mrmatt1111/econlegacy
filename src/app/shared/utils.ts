import { Random } from './random';

export class Utils {
    static shuffle(random: Random, array, times = 1) {
        for (let i = 0; i < times; i++) {
            let counter = array.length;

            // While there are elements in the array
            while (counter > 0) {
                // Pick a random index
                let index = random.nextInt(counter); // Math.floor(Math.random() * counter);

                // Decrease counter by 1
                counter--;

                // And swap the last element with it
                let temp = array[counter];
                array[counter] = array[index];
                array[index] = temp;
            }
        }

        return array;
    }
}
