import { ChangeDetectionStrategy, Component, input, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'sdc-test',
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent implements OnDestroy {
  #subject = new Subject<string>();
  #subs = new Subscription();

  testInput = input<string>('');

  useSubject = toSignal(this.#subject);

  constructor() {
    this.#subs.add(
      this.#subject.subscribe((value) => {
        console.log('Subject emitted value:', value);
      }),
    );
  }

  emitValue(inputValue: string) {
    this.#subject.next(inputValue);
  }

  ngOnDestroy() {
    this.#subs.unsubscribe();
  }
}
