import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
})
export class FormatDatePipe implements PipeTransform {
  transform(value: Date, ...args: number[]): unknown {
    // Convertim el valor d'entrada a un objecte Date
    const date = new Date(value);

    // Verifiquem si la data és vàlida
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    // Obtenim el format des de l'argumemt (per defecte 1)
    const format = args[0] ?? 1;

    // Obtenim el dia, mes i any de la data i ens assegurem que tinguin dos dígits
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    // Retornem la data amb el format especificat
    switch (format) {
      case 1:
        return `${day}${month}${year}`;
      case 2:
        return `${day} / ${month} / ${year}`;
      case 3:
        return `${day}/${month}/${year}`;
      case 4:
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }
}
