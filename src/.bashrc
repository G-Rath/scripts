# this contains some tmux goodness - at some point it should probably be broken out into a .dotfile repo

# gets the value of an env value in the win32 host
# 2>nul is for suppressing errors, in particular warnings about UNC
winenv() { cmd.exe /C "echo %$1%" 2>nul; }
winenvpath() { winpath $(winenv $1); }

# nice alias for win c:\ drive
export WROOT=$(wslpath C:\\)

# nice alias for win32s %HOME%
export WHOME=$(winenvpath HOME)
export WBIN=$(winenvpath BIN)

### tfenv
export PATH="$HOME/.tfenv/bin:$PATH"

### rbenv
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

### nodenv
export PATH="$HOME/.nodenv/bin:$PATH"
eval "$(nodenv init -)"

### direnv
eval "$(direnv hook bash)"

### weasel-pageant - lets wsl use pageant running on host
eval $($WROOT/weasel-pageant/weasel-pageant -rb -a $HOME/.weasel-pageant.sock)

# point pgsql to win32-hosted postgres docker container
export PGHOST=localhost
export PGUSER=postgres

# expose win32 hosted .aws creds to awscli in wsl
export AWS_SHARED_CREDENTIALS_FILE=$WHOME/.aws/credentials
export AWS_CONFIG_FILE=$WHOME/.aws/config

complete -C aws_completer aws
