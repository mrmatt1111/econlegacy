import { EconlegacyPage } from './app.po';

describe('econlegacy App', function() {
  let page: EconlegacyPage;

  beforeEach(() => {
    page = new EconlegacyPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
